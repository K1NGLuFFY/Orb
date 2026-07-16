import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const HeroBanner = ({ product, products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Select the top 5 featured items for the homepage carousel (cinematic only)
  const featuredItems = useMemo(() => {
    if (products && products.length > 0) {
      // Filter out print media (Books, Comics, Manga) to display only cinematic items (Movies, Anime)
      const cinematicProducts = products.filter(p => 
        p.category?.toLowerCase() === 'movie' || 
        p.category?.toLowerCase() === 'anime'
      );
      const withImages = cinematicProducts.filter(p => p.imageUrl && p.imageUrl.trim() !== '');
      if (withImages.length > 0) {
        // Sort by rating descending to show the best content, then slice 5
        return [...withImages].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
      }
      return cinematicProducts.slice(0, 5);
    }
    if (product) {
      const isCinematic = product.category?.toLowerCase() === 'movie' || product.category?.toLowerCase() === 'anime';
      return isCinematic ? [product] : [];
    }
    return [];
  }, [products, product]);

  // Handle auto-rotation
  useEffect(() => {
    if (isPaused || featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredItems.length);
    }, 6000); // 6s rotation speed
    return () => clearInterval(interval);
  }, [isPaused, featuredItems.length]);

  if (featuredItems.length === 0) {
    return (
      <section className="cinematic-hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)', animation: 'pulse 1.5s infinite' }}>
          LOADING FEATURE DOSSIERS...
        </div>
      </section>
    );
  }

  return (
    <section 
      className="cinematic-hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {featuredItems.map((item, idx) => {
        const isActive = idx === currentIndex;
        const spineColor = categoryColors[item.category] || 'var(--signal)';
        
        return (
          <div key={item.id} className={`hero-slide ${isActive ? 'active' : ''}`}>
            {/* 1. The Full-Bleed Background Image */}
            <div className="hero-bg-wrapper">
              <img src={item.imageUrl || FALLBACK_IMAGE} className="hero-bg-image" alt="Backdrop" />
              {/* 2. The Vignette & Bottom Fade Gradients */}
              <div className="hero-vignette-left" />
              <div className="hero-fade-bottom" />
            </div>

            {/* 3. The Content Layer (Text on left, Crisp Poster on right) */}
            <div className="hero-content-layer">
              <div className="hero-text-block">
                <div className="hero-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <span className="accent-bar" style={{ display: 'inline-block', width: '4px', height: '14px', backgroundColor: spineColor }} />
                  <span className="hero-badge" style={{ color: spineColor }}>
                    {item.category}
                  </span>
                </div>
                
                <h1 className="hero-title">{item.title}</h1>
                
                <div className="hero-meta">
                  <span>{item.releaseYear || '2026'}</span>
                  <span className="rating">★ {item.rating ? item.rating.toFixed(1) : '0.0'}</span>
                </div>

                <p className="hero-description">{item.description}</p>
                
                <div className="hero-actions">
                  <Link
                    to={`/product/${item.id}`}
                    className="btn btn-primary"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/product/${item.id}`}
                    className="btn btn-secondary"
                  >
                    More Info
                  </Link>
                </div>
              </div>

              {/* Right: The Sharp, Un-stretched Poster */}
              <div className="hero-poster-block">
                <img src={item.imageUrl || FALLBACK_IMAGE} alt="Poster" className="hero-crisp-poster" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Carousel Dot Indicators */}
      {featuredItems.length > 1 && (
        <div className="hero-indicators">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`hero-indicator-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
