import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storageHelper } from '../../utils/storageHelper';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/Common/ProductCard';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';

import { getMovieDetails } from '../../services/tmdbApi';
import { getAnimeDetails } from '../../services/jikanApi';
import { getBookDetails } from '../../services/googleBooksApi';

const isApiProduct = (productId) =>
  typeof productId === 'string' && (
    productId.startsWith('api-movie-') ||
    productId.startsWith('api-anime-') ||
    productId.startsWith('api-book-')
  );

const BuyerDashboard = () => {
  const { currentUser, updateProfile } = useAuth();
  const { wishlist, removeFromWishlist } = useCart();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { deleteAccount, deleting, deleteError } = useDeleteAccount();
  const activeTab = searchParams.get('tab') || 'overview';

  // State
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    password: '',
    confirmPassword: ''
  });
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Load dashboard data
  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      try {
        const [dbProducts, dbOrders] = await Promise.all([
          storageHelper.getProducts(),
          storageHelper.getOrders({ userId: currentUser.id })
        ]);
        if (active) {
          setProducts(dbProducts);
          setOrders(dbOrders);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    }
    if (currentUser) {
      loadDashboardData();
    }
    return () => { active = false; };
  }, [currentUser]);

  // Sync wishlist list if state updates
  useEffect(() => {
    let active = true;
    async function hydrateWishlist() {
      // 1. Filter database products
      const dbWishlistItems = products.filter(p => wishlist.includes(p.id));

      // 2. Identify API product IDs in wishlist
      const apiProductIds = wishlist.filter(id => isApiProduct(id));

      if (apiProductIds.length === 0) {
        if (active) {
          setWishlistItems(dbWishlistItems);
        }
        return;
      }

      // 3. Fetch API product details in parallel
      try {
        const apiFetches = apiProductIds.map(async (id) => {
          try {
            if (id.startsWith('api-movie-')) {
              return await getMovieDetails(id);
            } else if (id.startsWith('api-anime-')) {
              return await getAnimeDetails(id);
            } else if (id.startsWith('api-book-')) {
              return await getBookDetails(id);
            }
          } catch (err) {
            console.error(`Failed to fetch details for API product ${id}:`, err);
          }
          return null;
        });

        const fetchedApiProducts = (await Promise.all(apiFetches)).filter(Boolean);

        if (active) {
          setWishlistItems([...dbWishlistItems, ...fetchedApiProducts]);
        }
      } catch (err) {
        console.error('Error hydrating wishlist with API products:', err);
        if (active) {
          setWishlistItems(dbWishlistItems);
        }
      }
    }

    hydrateWishlist();
    return () => { active = false; };
  }, [wishlist, products]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ text: '', type: '' });

    if (!profileForm.name || !profileForm.email) {
      setFeedback({ text: 'Name and email are required fields.', type: 'error' });
      return;
    }

    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        setFeedback({ text: 'New password must be at least 6 characters.', type: 'error' });
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setFeedback({ text: 'Passwords do not match.', type: 'error' });
        return;
      }
    }

    const fieldsToUpdate = {
      name: profileForm.name,
      email: profileForm.email
    };

    if (profileForm.password) {
      fieldsToUpdate.password = profileForm.password;
    }

    const success = await updateProfile(fieldsToUpdate);
    if (success) {
      setFeedback({ text: 'Profile updated successfully!', type: 'success' });
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } else {
      setFeedback({ text: 'Failed to update profile. Email might be in use.', type: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.'
    );
    if (!confirmed) return;

    const success = await deleteAccount();
    if (success) {
      navigate('/');
    }
  };

  // Helper stats
  const totalOrdersCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      {/* Title Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="display-title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
          {activeTab === 'overview' && 'BUYER DOSSIER'}
          {activeTab === 'wishlist' && 'MY WATCHLIST'}
          {activeTab === 'orders' && 'PURCHASE RECORDS'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {activeTab === 'overview' && 'View your collection summary and manage account preferences.'}
          {activeTab === 'wishlist' && 'Click items to view specifications or remove titles from your shelf.'}
          {activeTab === 'orders' && 'Browse invoice records and order details from the simulation.'}
        </p>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Stats Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Quick Stats Grid */}
            <div className="stats-grid-2col">
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--hairline)',
                padding: '1.5rem',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Orders Checked Out
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  {totalOrdersCount}
                </span>
              </div>

              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--hairline)',
                padding: '1.5rem',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Simulated Total Spent
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                  ${totalSpent.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: '6px',
              padding: '2rem'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
                Catalog Identification
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Holder: </span>
                  <span style={{ fontWeight: '600' }}>{currentUser.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email/ID: </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{currentUser.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Active Since: </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Role status: </span>
                  <span style={{
                    color: 'var(--signal)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(255, 106, 61, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    marginLeft: '6px'
                  }}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Edit Form */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            padding: '2rem'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
              Modify Preferences
            </h3>

            {feedback.text && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: feedback.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255, 106, 61, 0.15)',
                border: `1px solid ${feedback.type === 'error' ? '#e63946' : 'var(--signal)'}`,
                color: feedback.type === 'error' ? '#ff6b76' : 'var(--text)',
                borderRadius: '4px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontWeight: '500'
              }}>
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                <label className="form-label">New Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="form-input"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Save Profile Changes
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem', marginTop: '2rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Danger Zone
              </span>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderColor: '#e63946',
                  color: '#ff6b76',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px'
                }}
              >
                {deleting ? 'Deleting Account...' : 'Delete My Account'}
              </button>
              {deleteError && (
                <div style={{ marginTop: '0.75rem', color: '#ff6b76', fontSize: '0.85rem' }}>
                  {deleteError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistItems.length > 0 ? (
            <div className="catalog-grid" style={{ padding: '12px 0 24px 0' }}>
              {wishlistItems.map(item => (
                <div key={item.id} style={{ position: 'relative' }}>
                  {/* Remove Wishlist Button overlay */}
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(230, 57, 70, 0.9)',
                      border: 'none',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      zIndex: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}
                    title="Remove from Shelf"
                  >
                    ✕
                  </button>
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '6rem 2rem',
              background: 'var(--panel)',
              border: '1px dashed var(--hairline)',
              borderRadius: '6px'
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Your shelf is empty. Browse the catalog to add something.
              </p>
              <Link to="/browse" className="btn btn-primary">
                Explore Catalog
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ORDER HISTORY TAB */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.length > 0 ? (
            [...orders].reverse().map(order => (
              <div 
                key={order.id} 
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--hairline)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}
              >
                {/* Header info */}
                <div style={{
                  backgroundColor: 'var(--panel-raised)',
                  padding: '1.25rem 2rem',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                        Date Placed
                      </span>
                      <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                        {new Date(order.date).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                        Order ID
                      </span>
                      <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>
                        {order.id}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                        Receipt Invoice
                      </span>
                      <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                        {order.receiptNumber}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', textAlign: 'right' }}>
                      Invoice Total
                    </span>
                    <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--signal)' }}>
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items Row list */}
                <div style={{ padding: '1rem clamp(1rem, 4vw, 2rem)', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--hairline)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0', fontWeight: 'normal' }}>Item Specification</th>
                        <th style={{ padding: '0.5rem 0', fontWeight: 'normal', width: '100px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.5rem 0', fontWeight: 'normal', width: '120px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '0.5rem 0', fontWeight: 'normal', width: '120px', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '1rem 0' }}>
                            <Link to={`/product/${item.productId}`} style={{ color: 'var(--text)', fontWeight: 'bold', display: 'block' }}>
                              {item.title}
                            </Link>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Category: {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '1rem 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            ${item.price.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 0', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '6rem 2rem',
              background: 'var(--panel)',
              border: '1px dashed var(--hairline)',
              borderRadius: '6px'
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                You have not checked out any items yet.
              </p>
              <Link to="/browse" className="btn btn-primary">
                Shop the Catalog
              </Link>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default BuyerDashboard;
