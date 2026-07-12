import React from 'react';
import ProductCard from './ProductCard';
import ProductGrid from './ProductGrid';

const CategoryRow = ({ title, products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div 
      className="category-row-wrapper" 
      style={{ 
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '0 1.5rem',
        marginBottom: '2.5rem',
        boxSizing: 'border-box'
      }}
    >
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

      <ProductGrid>
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </div>
  );
};

export default CategoryRow;
