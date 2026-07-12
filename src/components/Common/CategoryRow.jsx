import React, { useRef } from 'react';
import ProductCard from './ProductCard';

const CategoryRow = ({ title, products }) => {
  const rowRef = useRef(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      // Scroll by 80% of the visible container width
      const scrollAmount = clientWidth * 0.8;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      className="category-row-wrapper" 
      style={{ 
        position: 'relative', 
        marginBottom: '2.5rem'
      }}
    >
      {/* Self-contained CSS style block for scrollbar hiding and arrow visibility */}
      <style>{`
        .netflix-row-container::-webkit-scrollbar {
          display: none;
        }
        .scroll-arrow {
          opacity: 0;
          pointer-events: none;
        }
        .category-row-wrapper:hover .scroll-arrow {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>

      {/* Row Header */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text)',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: 'var(--signal)' }}>//</span> {title}
      </h3>

      {/* Scrollable Container Container */}
      <div style={{ position: 'relative' }}>
        {/* Left Arrow Button */}
        <button
          className="scroll-arrow"
          onClick={() => handleScroll('left')}
          style={{
            position: 'absolute',
            left: '-2.5rem',
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to right, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.4) 100%)',
            border: 'none',
            color: 'var(--text)',
            fontSize: '2rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.25s ease, background 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--signal)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
        >
          ‹
        </button>

        {/* The Scroll Container itself */}
        <div
          ref={rowRef}
          className="netflix-row-container"
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '1.25rem',
            padding: '0.75rem 0.25rem 1.5rem 0.25rem', // Bottom padding for card hover expansions
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none', // Standard Firefox
            msOverflowStyle: 'none'  // IE/Edge
          }}
        >
          {products.map(product => (
            <div 
              key={product.id} 
              style={{ 
                flex: '0 0 auto', 
                scrollSnapAlign: 'start'
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          className="scroll-arrow"
          onClick={() => handleScroll('right')}
          style={{
            position: 'absolute',
            right: '-2.5rem',
            top: 0,
            bottom: 0,
            width: '40px',
            background: 'linear-gradient(to left, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.4) 100%)',
            border: 'none',
            color: 'var(--text)',
            fontSize: '2rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.25s ease, background 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--signal)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default CategoryRow;
