import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';

import moviePlaceholder from '../../assets/placeholders/movie.svg';
import bookPlaceholder from '../../assets/placeholders/book.svg';
import comicPlaceholder from '../../assets/placeholders/comic.svg';
import animePlaceholder from '../../assets/placeholders/anime.svg';

const placeholders = {
  Movie: moviePlaceholder,
  Anime: animePlaceholder,
  Book: bookPlaceholder,
  Manga: bookPlaceholder,
  Comic: comicPlaceholder
};

export const FALLBACK_IMAGE = bookPlaceholder;

const ProductCard = ({ product, variant = 'standard', overlayBadges = false }) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();

  if (!product) return null;

  const fallbackSrc = placeholders[product.category] || bookPlaceholder;
  const imageUrl = product.imageUrl && product.imageUrl.trim() !== '' ? product.imageUrl : fallbackSrc;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent React Router link trigger
    e.stopPropagation(); // Prevent route activation bubble
    addToCart(product, 1);
  };

  return (
    <Link to={`/product/${product.id}`} className="premium-card">
      <div className="premium-card-image-wrapper">
        <img 
          src={imageUrl} 
          alt={product.title} 
          loading="lazy" 
          onError={(e) => {
            if (e.target.src !== fallbackSrc) {
              e.target.src = fallbackSrc;
            }
          }}
        />
        
        {/* Sold Out Overlay */}
        {product.stock === 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 10, 10, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 7
          }}>
            <span style={{
              border: '1px solid var(--signal)',
              color: 'var(--signal)',
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              borderRadius: '3px',
              transform: 'rotate(-5deg)',
              boxShadow: '0 0 8px rgba(255, 84, 0, 0.5)'
            }}>
              Sold Out
            </span>
          </div>
        )}

        <div className="premium-card-overlay">
          {product.stock > 0 && (
            <button 
              className="premium-card-btn"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
      <div className="premium-card-info">
        <div className="premium-card-type">{product.category}</div>
        <h3 className="premium-card-title">{product.title}</h3>
        <div className="premium-card-meta">
          <span className="premium-card-price">{formatCurrency(product.price)}</span>
          <span style={{ color: 'var(--text-muted)' }}>★ {product.rating ? product.rating.toFixed(1) : '0.0'}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
