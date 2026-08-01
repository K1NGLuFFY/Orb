import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Failed to get user');

    // Admin Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Fetch orders (only needed fields to save memory)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('created_at, total, items');
      
    if (ordersError) throw ordersError;

    // Aggregate Sales Over Time
    const salesDataMap = {};
    const categoryMap = {};

    orders.forEach(order => {
      // Group by YYYY-MM-DD
      const date = new Date(order.created_at).toISOString().split('T')[0]; 
      if (!salesDataMap[date]) {
        salesDataMap[date] = 0;
      }
      salesDataMap[date] += order.total;

      // Group Categories
      order.items.forEach(item => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = 0;
        }
        categoryMap[item.category] += item.quantity;
      });
    });

    const salesOverTime = Object.keys(salesDataMap).sort().map(date => ({
      date,
      totalSales: salesDataMap[date]
    }));

    const topCategories = Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat]
    })).sort((a, b) => b.value - a.value);

    // Fetch users for growth metrics
    // Since profiles might not explicitly have a reliable created_at without admin rights,
    // we use a simple try-catch for created_at.
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('created_at');

    let userGrowth = [];
    if (!usersError && users) {
      const userDateMap = {};
      users.forEach(u => {
        const dateStr = u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2024-01-01';
        if (!userDateMap[dateStr]) userDateMap[dateStr] = 0;
        userDateMap[dateStr] += 1;
      });

      let cumulative = 0;
      userGrowth = Object.keys(userDateMap).sort().map(date => {
        cumulative += userDateMap[date];
        return {
          date,
          users: cumulative
        };
      });
    }

    // Edge Caching: Cache aggressively at the edge for 60 seconds
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      salesOverTime,
      topCategories,
      userGrowth
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
