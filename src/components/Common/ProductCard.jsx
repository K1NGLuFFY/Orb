import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

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

  // Determine aspect ratio class name based on variant or product category
  let cardClass = 'poster-card';
  if (variant === 'landscape') {
    cardClass = 'landscape-card';
  } else if (product.category === 'Book' || product.category === 'Manga') {
    cardClass = 'book-card';
  }

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent React Router link trigger
    e.stopPropagation(); // Prevent route activation bubble
    addToCart(product, 1);
  };

  return (
    <Link className="media-card-link" to={`/product/${product.id}`}>
      <article className={`media-card ${cardClass}`}>
        <figure className="card-poster">
          <img 
            src={imageUrl} 
            loading="lazy" 
            alt={product.title} 
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
                boxShadow: 'var(--signal-glow)'
              }}>
                Sold Out
              </span>
            </div>
          )}

          {/* HOVER OVERLAY: Hidden by default, slides up on hover */}
          <div className="card-overlay">
            {product.stock > 0 && (
              <button 
                type="button" 
                className="btn-add-cart"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
            )}
          </div>
        </figure>

        {/* METADATA */}
        <div className="card-metadata">
          <h3 className="card-title">{product.title}</h3>
          <span className="card-creator">{product.creator}</span>
          <div className="card-economics">
            <span className="card-price">${product.price.toFixed(2)}</span>
            <span className="card-rating">★ {product.rating ? product.rating.toFixed(1) : '0.0'}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
