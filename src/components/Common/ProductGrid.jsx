import React from 'react';

const ProductGrid = ({ children, style = {}, className = '' }) => {
  return (
    <div 
      className={`catalog-grid ${className}`} 
      style={style}
    >
      {children}
    </div>
  );
};

export default ProductGrid;
