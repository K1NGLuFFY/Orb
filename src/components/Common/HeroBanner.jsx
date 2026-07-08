import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const HeroBanner = ({ product }) => {
  const [adaptiveColor, setAdaptiveColor] = useState('var(--signal)');
  const [scrollY, setScrollY] = useState(0);

  // 1. Scroll parallax hook
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Canvas dominant color extraction hook
  useEffect(() => {
    if (!product) return;

    const fallbackColor = categoryColors[product.category] || 'var(--signal)';
    setAdaptiveColor(fallbackColor);

    if (!product.imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = product.imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        // Boost visibility of dark colors
        let [nr, ng, nb] = [r, g, b];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
        if (brightness < 60) {
          nr = Math.min(255, r + 70);
          ng = Math.min(255, g + 70);
          nb = Math.min(255, b + 70);
        }

        setAdaptiveColor(`rgb(${nr}, ${ng}, ${nb})`);
      } catch (err) {
        console.warn('Canvas color extraction blocked or failed:', err);
        setAdaptiveColor(fallbackColor);
      }
    };

    img.onerror = () => {
      setAdaptiveColor(fallbackColor);
    };
  }, [product]);

  if (!product) {
    return (
      <div style={{ height: '65vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)', animation: 'pulse 1.5s infinite' }}>
          LOADING DOSSIER FEATURE...
        </div>
      </div>
    );
  }

  // Determine high contrast CTA button text color based on accent brightness
  const rgbValues = adaptiveColor.match(/\d+/g);
  const isLightAccent = rgbValues
    ? parseInt(rgbValues[0]) * 0.299 + parseInt(rgbValues[1]) * 0.587 + parseInt(rgbValues[2]) * 0.114 > 140
    : false;
  const buttonTextColor = isLightAccent ? '#0d0e10' : '#ffffff';

  return (
    <div style={{
      width: '100%',
      height: '65vh',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid var(--hairline)',
      display: 'flex',
      alignItems: 'flex-end',
      background: 'var(--ink)'
    }} className="hero-banner">

      {/* Global CSS Inject for looping Ken Burns effect */}
      <style>{`
        @keyframes kenburns-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .kenburns-bg {
          animation: kenburns-zoom 25s infinite ease-in-out;
        }
      `}</style>

      {/* Parallax outer wrapper + Ken Burns inner cover */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: 0,
        right: 0,
        height: '120%', // Buffer space prevents edge leakage on translation
        transform: `translateY(${scrollY * 0.3}px)`, // Parallax translation
        transition: 'transform 0.05s linear',
        zIndex: 0
      }}>
        <div 
          className="kenburns-bg"
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${product.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            transition: 'background-image 0.5s ease-in-out'
          }}
        />
      </div>

      {/* Immersive Dark Gradient Overlays */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to top, var(--ink) 0%, rgba(10, 10, 10, 0.4) 50%, rgba(10, 10, 10, 0.8) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to right, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.6) 40%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      {/* Grid lines pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(var(--hairline) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 3
      }} />

      {/* Content Block */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '650px',
        margin: '0 0 4rem 4rem',
        paddingRight: '2rem'
      }}>
        {/* Category tag indicator with dynamic adaptive color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <span style={{ width: '4px', height: '14px', backgroundColor: adaptiveColor }} />
          <span style={{ 
            color: adaptiveColor, 
            fontSize: '0.8rem', 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            fontFamily: 'var(--font-mono)' 
          }}>
            {product.category}
          </span>
        </div>

        {/* Big Bold Headline in display font */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.5rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          color: 'var(--text)',
          margin: '0 0 1rem 0',
          lineHeight: '1.05',
          letterSpacing: '-0.02em',
          textShadow: '0 4px 16px rgba(0,0,0,0.9)'
        }}>
          {product.title}
        </h1>

        {/* Truncated description */}
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.05rem',
          lineHeight: '1.6',
          margin: '0 0 2rem 0',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textShadow: '0 2px 8px rgba(0,0,0,0.7)'
        }}>
          {product.description}
        </p>

        {/* CTA Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link 
            to={`/product/${product.id}`} 
            className="btn btn-primary"
            style={{ 
              padding: '0.8rem 2.25rem', 
              fontSize: '0.95rem',
              fontWeight: 'bold',
              borderRadius: '4px',
              backgroundColor: adaptiveColor,
              color: buttonTextColor,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = `0 0 16px ${adaptiveColor}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            View Details
          </Link>
          <Link 
            to={`/product/${product.id}`} 
            style={{ 
              padding: '0.8rem 2.25rem', 
              fontSize: '0.95rem',
              fontWeight: 'bold',
              borderRadius: '4px',
              border: `1px solid ${adaptiveColor}`,
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${adaptiveColor}15`;
              e.currentTarget.style.borderColor = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = adaptiveColor;
            }}
          >
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
