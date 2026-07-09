import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Common/Navbar';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const CartPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  // Sync cartItems whenever cart state changes
  useEffect(() => {
    setCartItems(cart);
  }, [cart]);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Simulated without tax/shipping for demo simplicity

  const handleCheckoutRedirect = () => {
    if (!currentUser) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: 'clamp(1.5rem, 4vh, 3rem) auto',
        padding: '0 clamp(1rem, 4vw, 2rem)',
        boxSizing: 'border-box'
      }}>
        
        {/* Title */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="display-title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            YOUR SELECTIONS CART
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Review your fanned collection holdings before proceeding to checkout simulation.
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div style={{ alignItems: 'start' }} className="cart-grid">
            
            {/* 1. Items List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {cartItems.map(item => {
                const dotColor = categoryColors[item.category] || 'var(--text-muted)';
                return (
                  <div 
                    key={item.id}
                    className="cart-item-row"
                    style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '6px'
                    }}
                  >
                    {/* Left Spine Tab */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: dotColor
                    }} />

                    {/* Thumbnail */}
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="cart-item-image"
                    />

                    {/* Title & Creator */}
                    <div className="cart-item-title-creator">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        {/* Colored spine dot */}
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          display: 'inline-block',
                          flexShrink: 0
                        }} />
                        <Link to={`/product/${item.id}`} style={{
                          fontWeight: 'bold',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          maxWidth: 'calc(100vw - 120px)'
                        }}>
                          {item.title}
                        </Link>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.creator} &bull; {item.category}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 0.25rem', fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.4rem 0.75rem', cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', opacity: item.quantity >= item.stock ? 0.3 : 1, fontSize: '0.85rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal (Mono font) */}
                    <div className="cart-item-subtotal">
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--signal)' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="cart-item-remove"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.color = '#e63946'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 2. Order Summary Sidebar */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: '6px',
              padding: '1.5rem 1.75rem'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
                Shelf Total
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Holdings subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Simulated tax & post</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>$0.00</span>
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--hairline)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 'bold' }}>Total Due</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--signal)' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleCheckoutRedirect}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem 1rem' }}
              >
                Proceed to Checkout
              </button>

              <Link 
                to="/browse" 
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline'
                }}
              >
                Continue Browsing
              </Link>
            </div>

          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '6rem 2rem',
            background: 'var(--panel)',
            border: '1px dashed var(--hairline)',
            borderRadius: '6px'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Your shelf is empty. Browse the catalog to add something.
            </p>
            <Link to="/browse" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
              Browse physical catalog
            </Link>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--hairline)',
        backgroundColor: 'var(--panel)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        <span>&copy; 2026 Orbit Cart. Simulated billing transactions.</span>
      </footer>

    </div>
  );
};

export default CartPage;
