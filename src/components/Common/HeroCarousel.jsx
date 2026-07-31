import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeroCarousel = ({ items = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  return (
    <div className="hero-carousel-container">
      {items.map((item, index) => (
        <div 
          key={item.id || index} 
          className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
        >
          <img 
            src={item.image} 
            alt={item.title} 
            className="hero-slide-bg" 
          />
          <div className="hero-slide-overlay"></div>
          
          <div className="hero-slide-content">
            <div className="hero-category-tag">
              // {item.category || 'FEATURED'}
            </div>
            <h1 className="hero-title">{item.title}</h1>
            <p className="hero-description">
              {item.description || item.creator || 'Experience the best content curated just for you. Dive into new worlds and explore.'}
            </p>
            <div className="hero-actions-container">
              <Link to={`/product/${item.id}`} className="btn btn-primary">
                View Details
              </Link>
              <Link to="/browse" className="btn btn-secondary">
                More Info
              </Link>
            </div>
          </div>
        </div>
      ))}

      {items.length > 1 && (
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
