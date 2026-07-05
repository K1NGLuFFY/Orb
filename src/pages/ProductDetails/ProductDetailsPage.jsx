import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { readStorage, KEYS } from '../../utils/localStorage';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Common/Navbar';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const creatorLabels = {
  Anime: 'Studio',
  Manga: 'Author',
  Book: 'Author',
  Comic: 'Author/Artist',
  Movie: 'Director'
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart, wishlist, addToWishlist, removeFromWishlist } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' }); // success | error

  useEffect(() => {
    const products = readStorage(KEYS.PRODUCTS) || [];
    const foundProduct = products.find(p => p.id === id);
    setProduct(foundProduct);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--text)'
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>
          RETRIEVING ITEM DOSSIER...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--text)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--signal)', marginBottom: '1rem' }}>
          OUT OF ARCHIVE
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          This product isn't on the shelf.
        </p>
        <Link to="/browse" className="btn btn-primary">
          Return to Browse
        </Link>
      </div>
    );
  }

  const spineColor = categoryColors[product.category] || 'var(--text-muted)';
  const creatorLabel = creatorLabels[product.category] || 'Creator';
  
  const isWishlisted = wishlist.includes(product.id);
  const isBuyer = !currentUser || currentUser.role === 'Buyer';

  const showFeedback = (text, type = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage({ text: '', type: '' });
    }, 4500);
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      showFeedback('Please log in to add items to your cart.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (currentUser.role !== 'Buyer') {
      showFeedback(`Role "${currentUser.role}" is unauthorized to purchase catalog items.`, 'error');
      return;
    }

    if (product.stock <= 0) {
      showFeedback("This one's sold out. Check back later or browse similar titles.", 'error');
      return;
    }

    if (quantity > product.stock) {
      showFeedback(`Cannot add ${quantity} items. Only ${product.stock} left in stock.`, 'error');
      return;
    }

    const success = addToCart(product, quantity);
    if (success) {
      showFeedback(`Added ${quantity} x "${product.title}" to your shelf cart!`);
    } else {
      showFeedback('Failed to add item to cart. Please try again.', 'error');
    }
  };

  const handleToggleWishlist = () => {
    if (!currentUser) {
      showFeedback('Please log in to wishlist items.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (currentUser.role !== 'Buyer') {
      showFeedback('Only buyers can manage wishlists.', 'error');
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      showFeedback('Removed from your wishlist.');
    } else {
      addToWishlist(product.id);
      showFeedback('Added to your wishlist!');
    }
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Navbar />

      {/* Main product wrapper */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '3rem auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '4rem',
        alignItems: 'start'
      }}>
        
        {/* Left Side: Image display with thick Spine tab */}
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--hairline)',
          background: 'var(--panel)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
        }}>
          {/* Thick 8px Spine Tab */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            backgroundColor: spineColor,
            zIndex: 5
          }} />

          <img 
            src={product.imageUrl} 
            alt={product.title} 
            style={{
              width: '100%',
              display: 'block',
              paddingLeft: '8px',
              maxHeight: '550px',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Right Side: Specifications / Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Breadcrumb / Category dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/browse" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Browse</Link>
            <span style={{ color: 'var(--hairline)' }}>/</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: spineColor,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: spineColor }} />
              {product.category}
            </span>
          </div>

          {/* Title and Creator */}
          <div>
            <h1 className="display-title" style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: '1',
              color: 'var(--text)',
              marginBottom: '0.5rem'
            }}>
              {product.title}
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)' }}>
              {creatorLabel}: <span style={{ color: 'var(--text)', fontWeight: '500' }}>{product.creator}</span>
            </p>
          </div>

          {/* Feedback popup message inside card flow */}
          {feedbackMessage.text && (
            <div style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: feedbackMessage.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255, 106, 61, 0.15)',
              border: `1px solid ${feedbackMessage.type === 'error' ? '#e63946' : 'var(--signal)'}`,
              borderRadius: '4px',
              color: feedbackMessage.type === 'error' ? '#ff6b76' : 'var(--text)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              {feedbackMessage.text}
            </div>
          )}

          {/* Price & Rating chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            borderTop: '1px solid var(--hairline)',
            borderBottom: '1px solid var(--hairline)',
            padding: '1.25rem 0'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Pricing
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.25rem',
                color: 'var(--signal)',
                fontWeight: 'bold'
              }}>
                ${product.price.toFixed(2)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                User Rating
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#FFD700', fontSize: '1.5rem' }}>★</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {product.rating.toFixed(1)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Product Details Block */}
          <div>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Item Details
            </h3>
            <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          {/* Technical Specs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem 2rem',
            background: 'var(--panel)',
            padding: '1.25rem',
            borderRadius: '6px',
            border: '1px solid var(--hairline)',
            fontSize: '0.9rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Year Released: </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{product.releaseYear}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Language: </span>
              <span>{product.language}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Seller: </span>
              <span style={{ color: 'var(--signal)' }}>{product.sellerName}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Stock Code: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{product.id}</span>
            </div>
          </div>

          {/* Buy and Add to Cart Section */}
          <div style={{
            borderTop: '1px solid var(--hairline)',
            paddingTop: '1.5rem',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {product.stock > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantity:</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--hairline)', borderRadius: '4px', background: 'var(--panel)' }}>
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ padding: '0 0.5rem', fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      style={{ background: 'none', border: 'none', color: 'var(--text)', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    ({product.stock} available)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={handleAddToCart}
                    disabled={!isBuyer}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.85rem 1.5rem', opacity: isBuyer ? 1 : 0.5, cursor: isBuyer ? 'pointer' : 'not-allowed' }}
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={handleToggleWishlist}
                    disabled={!isBuyer}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderColor: isWishlisted ? 'var(--signal)' : 'var(--hairline)',
                      color: isWishlisted ? 'var(--signal)' : 'var(--text)',
                      opacity: isBuyer ? 1 : 0.5,
                      cursor: isBuyer ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isWishlisted ? '★ Wishlisted' : '☆ Wishlist'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: 'rgba(230, 57, 70, 0.1)',
                border: '1px dashed #e63946',
                borderRadius: '6px',
                color: '#ff6b76',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                This one's sold out. Check back later or browse similar titles.
              </div>
            )}
            
            {!isBuyer && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                * Standard purchasing controls are deactivated for logged-in Seller, Staff, or Admin roles.
              </p>
            )}
          </div>

        </div>
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
        <span>&copy; 2026 Orbit Media Repository. Simulated system.</span>
      </footer>

    </div>
  );
};

export default ProductDetailsPage;
