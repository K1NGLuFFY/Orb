import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics = () => {
  const [data, setData] = useState({
    salesOverTime: [],
    topCategories: [],
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('No active session');

        const response = await fetch('/api/admin-analytics', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch analytics');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics data...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#FF4D6D' }}>Error loading analytics: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
        Admin Analytics Dashboard
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Sales Over Time Chart */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--signal)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Sales Over Time</h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282a36" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--hairline)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalSales" stroke="var(--signal)" activeDot={{ r: 8 }} name="Sales (₦)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
          <h4 style={{ marginBottom: '1rem', color: '#00D9C0', fontSize: '0.9rem', textTransform: 'uppercase' }}>User Growth Over Time</h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282a36" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--hairline)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#00D9C0" activeDot={{ r: 8 }} name="Total Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Pie Chart */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', padding: '1.5rem', borderRadius: '6px' }}>
          <h4 style={{ marginBottom: '1rem', color: '#FFC94D', fontSize: '0.9rem', textTransform: 'uppercase' }}>Top Selling Categories</h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.topCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--hairline)' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
