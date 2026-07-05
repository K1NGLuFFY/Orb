import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { readStorage, KEYS } from '../../utils/localStorage';
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
  const [products, setProducts] = useState([]);

  // Load products to hydrate cart info
  useEffect(() => {
    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    setProducts(dbProducts);
  }, []);

  // Hydrate cart items whenever cart or products change
  useEffect(() => {
    if (products.length > 0) {
      const items = cart.map(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) return null;
        return {
          ...prod,
          quantity: item.quantity
        };
      }).filter(Boolean);
      setCartItems(items);
    }
  }, [cart, products]);

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
        margin: '3rem auto',
        padding: '0 2rem'
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '2.5rem',
            alignItems: 'start'
          }} className="cart-grid">
            
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
                    style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '6px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      position: 'relative'
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
                      style={{
                        width: '50px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '3px',
                        border: '1px solid var(--hairline)',
                        marginLeft: '4px'
                      }}
                    />

                    {/* Title & Creator */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        {/* Colored spine dot */}
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          display: 'inline-block'
                        }} />
                        <Link to={`/product/${item.id}`} style={{
                          fontWeight: 'bold',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}>
                          {item.title}
                        </Link>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.creator} &bull; {item.category}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--hairline)', borderRadius: '4px', background: 'var(--panel-raised)' }}>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 0.25rem', fontFamily: 'var(--font-mono)', minWidth: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.4rem 0.75rem', cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', opacity: item.quantity >= item.stock ? 0.3 : 1, fontSize: '0.85rem' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal (Mono font) */}
                    <div style={{ width: '90px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--signal)' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
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
