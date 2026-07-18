import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Common/Navbar';
import CategoryRow from '../../components/Common/CategoryRow';
import { getMovieDetails, getPopularMovies } from '../../services/tmdbApi';
import { getAnimeDetails, getPopularAnime } from '../../services/jikanApi';
import { getBookDetails, getPopularBooks } from '../../services/googleBooksApi';
import { getMangaDetails } from '../../services/mangaApi';
import { getComicDetails } from '../../services/comicApi';
import { FALLBACK_IMAGE } from '../../components/Common/ProductCard';
import { useProductStockSubscription } from '../../hooks/useProductStockSubscription';
import { supabase } from '../../lib/supabaseClient';

const isApiProduct = (productId) =>
  typeof productId === 'string' && productId.startsWith('api-');

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
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' });
  const [recommendations, setRecommendations] = useState([]);

  // Realtime stock update handler
  const handleStockUpdate = useCallback((updatedProduct) => {
    if (updatedProduct.id === id) {
      setProduct(prev => prev ? { ...prev, stock: updatedProduct.stock } : prev);
    }
  }, [id]);

  const isSeededProduct = !isApiProduct(id);
  useProductStockSubscription(handleStockUpdate, isSeededProduct);

  // Load product details
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      try {
        if (!isApiProduct(id)) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw new Error(error.message);
          if (active && data) {
            setProduct(data);
          }
        } else {
          if (id.startsWith('api-movie-')) {
            const apiProduct = await getMovieDetails(id, controller.signal);
            if (active && apiProduct) setProduct(apiProduct);
          } else if (id.startsWith('api-anime-')) {
            const apiProduct = await getAnimeDetails(id, controller.signal);
            if (active && apiProduct) setProduct(apiProduct);
          } else if (id.startsWith('api-book-')) {
            const apiProduct = await getBookDetails(id, controller.signal);
            if (active && apiProduct) setProduct(apiProduct);
          } else if (id.startsWith('api-manga-')) {
            const apiProduct = await getMangaDetails(id, controller.signal);
            if (active && apiProduct) setProduct(apiProduct);
          } else if (id.startsWith('api-comic-')) {
            const apiProduct = await getComicDetails(id, controller.signal);
            if (active && apiProduct) setProduct(apiProduct);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load product details:', err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  // Load category recommendations
  useEffect(() => {
    if (!product) return;
    let active = true;
    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        let list = [];
        if (isApiProduct(product.id)) {
          if (product.category === 'Movie') {
            list = await getPopularMovies(controller.signal);
          } else if (product.category === 'Anime') {
            list = await getPopularAnime(controller.signal);
          } else if (product.category === 'Book') {
            list = await getPopularBooks(controller.signal);
          }
        } else {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', product.id)
            .limit(10);
          if (!error && data) {
            list = data;
          }
        }
        if (active) {
          // Filter out the current product and limit to 10
          setRecommendations(list.filter(item => item.id !== product.id).slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      }
    }

    loadRecommendations();

    return () => {
      active = false;
      controller.abort();
    };
  }, [product]);

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

  const handleToggleWishlist = async () => {
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
      const success = await removeFromWishlist(product.id, product.title);
      if (success !== false) {
        showFeedback('Removed from your wishlist.');
      } else {
        showFeedback('Failed to remove from wishlist. Please try again.', 'error');
      }
    } else {
      const success = await addToWishlist(product.id, product.title);
      if (success) {
        showFeedback('Added to your wishlist!');
      } else {
        showFeedback('Failed to add to wishlist. Please try again.', 'error');
      }
    }
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Immersive Blurred Backdrop Hero Area */}
      <section className="product-detail-hero animate-fade-in-up">
        <div className="product-hero-backdrop">
          <div 
            className="product-backdrop-image" 
            style={{ backgroundImage: `url(${product.imageUrl || FALLBACK_IMAGE})` }} 
          />
          <div className="product-scrim" />
        </div>

        <div className="product-hero-content">
          <div className="product-hero-flex-row product-detail-mobile-layout">
            
            {/* Left Column: Poster display with dynamic Spine tab */}
            <div className="product-poster-wrapper product-detail-poster-wrapper">
              <div className="product-spine-accent" style={{ backgroundColor: spineColor }} />
              <img
                src={product.imageUrl || FALLBACK_IMAGE}
                alt={product.title}
                className="product-detail-poster"
                onError={(e) => {
                  if (e.target.src !== FALLBACK_IMAGE) {
                    e.target.src = FALLBACK_IMAGE;
                  }
                }}
              />
            </div>

            {/* Right Column: Metadata and purchasing controls */}
            <div className="product-info-wrapper">
              {/* Category Breadcrumb */}
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

              {/* Title & Creator */}
              <div>
                <h1 className="display-title" style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  lineHeight: '1.05',
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                  textAlign: 'left'
                }}>
                  {product.title}
                </h1>
                <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                  {creatorLabel}: <span style={{ color: 'var(--text)', fontWeight: '500' }}>{product.creator}</span>
                </p>
              </div>

              {/* Inline Feedback Popup */}
              {feedbackMessage.text && (
                <div style={{
                  padding: '0.85rem 1.25rem',
                  backgroundColor: feedbackMessage.type === 'error' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255, 106, 61, 0.15)',
                  border: `1px solid ${feedbackMessage.type === 'error' ? '#e63946' : 'var(--signal)'}`,
                  borderRadius: '4px',
                  color: feedbackMessage.type === 'error' ? '#ff6b76' : 'var(--text)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'left'
                }}>
                  {feedbackMessage.text}
                </div>
              )}

              {/* Pricing & Ratings */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2.5rem',
                borderTop: '1px solid var(--hairline)',
                borderBottom: '1px solid var(--hairline)',
                padding: '1.25rem 0'
              }}>
                <div style={{ textAlign: 'left' }}>
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

                <div style={{ textAlign: 'left' }}>
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
                      {product.rating ? product.rating.toFixed(1) : '0.0'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  Item Details
                </h3>
                <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {product.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="specs-grid">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Year Released: </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{product.releaseYear || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Language: </span>
                  <span>{product.language || 'English'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Seller: </span>
                  <span style={{ color: 'var(--signal)' }}>{product.sellerName || 'Archive Catalog'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Stock Code: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{product.id}</span>
                </div>
              </div>

              {/* Quantity Selectors and Actions */}
              <div style={{
                borderTop: '1px solid var(--hairline)',
                paddingTop: '1.5rem',
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                {product.stock > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantity:</span>
                      
                      {/* Pill style selector */}
                      <div className="quantity-selector">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        >
                          +
                        </button>
                      </div>

                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        ({product.stock} available)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!isBuyer}
                        className="btn btn-primary"
                        style={{ 
                          flex: 1, 
                          padding: '0.85rem 1.5rem', 
                          minHeight: '44px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          opacity: isBuyer ? 1 : 0.5, 
                          cursor: isBuyer ? 'pointer' : 'not-allowed' 
                        }}
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleWishlist}
                        disabled={!isBuyer}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.85rem 1.25rem',
                          minHeight: '44px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
          </div>
        </div>
      </section>

      {/* Below Fold: Recommendations Shelf */}
      {recommendations.length > 0 && (
        <section style={{ padding: '3.5rem 0 1.5rem 0', backgroundColor: 'var(--ink)' }}>
          <CategoryRow title={`More from ${product.category}`} products={recommendations} />
        </section>
      )}

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
