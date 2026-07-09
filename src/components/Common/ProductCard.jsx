import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import moviePlaceholder from '../../assets/placeholders/movie.svg';
import bookPlaceholder from '../../assets/placeholders/book.svg';
import comicPlaceholder from '../../assets/placeholders/comic.svg';
import animePlaceholder from '../../assets/placeholders/anime.svg';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const placeholders = {
  Movie: moviePlaceholder,
  Anime: animePlaceholder,
  Book: bookPlaceholder,
  Manga: bookPlaceholder,
  Comic: comicPlaceholder
};

export const FALLBACK_IMAGE = bookPlaceholder;

/**
 * ProductCard component with Left Spine Tab.
 * Formatted as a Netflix-style poster card that lifts and glows on hover.
 */
const ProductCard = ({ product, overlayBadges = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const spineColor = categoryColors[product.category] || 'var(--text-muted)';
  const fallbackSrc = placeholders[product.category] || bookPlaceholder;

  return (
    <Link 
      to={`/product/${product.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        borderRadius: '6px',
        overflow: 'hidden', // Contained bounds prevent title text spill
        border: '1px solid var(--hairline)',
        position: 'relative',
        textDecoration: 'none',
        color: 'var(--text)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        height: '100%',
        minHeight: '290px',
        maxWidth: '180px',
        width: '100%',
        margin: '0 auto',
        transform: isHovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
        transformOrigin: 'center',
        boxShadow: isHovered ? '0 12px 24px rgba(0,0,0,0.5)' : 'none',
        zIndex: isHovered ? 10 : 1
      }}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 6px Left Spine Tab */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        backgroundColor: spineColor,
        zIndex: 5
      }} />

      {/* Product Cover Wrapper */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: 'transparent',
        overflow: 'hidden',
        paddingLeft: '6px' /* Offset from left spine tab */
      }}>
        <img 
          src={product.imageUrl || fallbackSrc} 
          alt={product.title}
          className="product-card-image"
          style={{
            display: 'block',
            width: '100%',
            aspectRatio: '2 / 3',
            objectFit: 'cover',
            height: 'auto'
          }}
          loading="lazy"
          onError={(e) => {
            if (e.target.src !== fallbackSrc) {
              e.target.src = fallbackSrc;
            }
          }}
        />

        {/* Bestseller Overlaid Badges */}
        {overlayBadges && (
          <>
            {/* Rating chip (Top-left) */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '14px', /* 8px + 6px offset */
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--hairline)',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#FFA000', /* Gold star */
              zIndex: 10
            }}>
              <span>★</span>
              <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {product.rating.toFixed(1)}
              </span>
            </div>

            {/* Price chip (Bottom-right) */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'var(--signal)',
              color: 'var(--signal-text)',
              padding: '3px 8px',
              borderRadius: '3px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              fontFamily: 'var(--font-mono)',
              zIndex: 10
            }}>
              ${product.price.toFixed(2)}
            </div>
          </>
        )}

        {/* Sold Out Overlay */}
        {product.stock === 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '6px',
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 8
          }}>
            <span style={{
              border: '1px solid var(--signal)',
              color: 'var(--signal)',
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: '3px',
              transform: 'rotate(-5deg)'
            }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info Block */}
      <div style={{
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'space-between',
        marginLeft: '6px' /* Offset from spine tab */
      }}>
        <div>
          {/* Category Label */}
          <span style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: spineColor,
            fontWeight: '600',
            display: 'block',
            marginBottom: '0.2rem'
          }}>
            {product.category}
          </span>
          {/* Title - Static alignment inside poster card bounds */}
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            fontFamily: 'var(--font-body)',
            lineHeight: '1.25',
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '2.4em',
            marginBottom: '0.25rem'
          }}>
            {product.title}
          </h4>
          {/* Creator Label / Name */}
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            display: 'block',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            {product.creator}
          </span>
        </div>

        {/* Below-cover Price/Stock (if not bestseller variant with overlays) */}
        {!overlayBadges && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid var(--hairline)'
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              color: 'var(--signal)',
              fontWeight: 'bold'
            }}>
              ${product.price.toFixed(2)}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: product.stock > 0 ? 'var(--text-muted)' : '#FF4D6D'
            }}>
              {product.stock > 0 ? `${product.stock} left` : 'Out'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
