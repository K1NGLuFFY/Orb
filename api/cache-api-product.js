import { createClient } from '@supabase/supabase-js';

// We implement a simple hash to generate deterministic prices from IDs server-side
function generatePriceFromId(id, category) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  switch (category) {
    case 'Book':
      return parseFloat((8.99 + (hash % 20) * 0.5).toFixed(2));
    case 'Comic':
      return parseFloat((14.99 + (hash % 25) * 0.5).toFixed(2));
    case 'Movie':
      return parseFloat((9.99 + (hash % 15) * 1.49).toFixed(2));
    case 'Anime':
    case 'Manga':
      return parseFloat((19.99 + (hash % 20) * 1.5).toFixed(2));
    default:
      return parseFloat((9.99 + (hash % 10)).toFixed(2));
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, title, category, imageUrl, source } = req.body;
  
  if (!id || !title || !category || !source) {
    return res.status(400).json({ error: 'Missing product details' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const price = generatePriceFromId(id, category);

    // Upsert into cache
    const { error } = await supabase
      .from('api_products_cache')
      .upsert({
        id,
        source,
        title,
        price,
        image_url: imageUrl
      }, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, price });
  } catch (error) {
    console.error('Cache API Product Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
