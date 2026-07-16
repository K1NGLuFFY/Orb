import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

const categoryMap = {
  Movies: 'Movie',
  Anime: 'Anime',
  Books: 'Book',
  Manga: 'Manga',
  Comics: 'Comic'
};

const categorySubtitles = {
  Movies: 'Cinematic releases & features',
  Anime: 'Acclaimed animated productions',
  Books: 'Curated literature & novels',
  Manga: 'Original Japanese graphic volumes',
  Comics: 'Graphic novels & comic collections'
};

const CategoryRow = ({ title, products }) => {
  const trackRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!products || products.length === 0) return null;

  const checkScrollBoundaries = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setShowLeftArrow(scrollLeft > 2);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollBoundaries, { passive: true });
      checkScrollBoundaries();

      // Trigger checks on a short delay to account for rendering/layout shifts
      const timer = setTimeout(checkScrollBoundaries, 400);
      window.addEventListener('resize', checkScrollBoundaries);

      return () => {
        el.removeEventListener('scroll', checkScrollBoundaries);
        window.removeEventListener('resize', checkScrollBoundaries);
        clearTimeout(timer);
      };
    }
  }, [products]);

  const handleScroll = (direction) => {
    if (trackRef.current) {
      const { clientWidth } = trackRef.current;
      // Scroll by 75% of viewable width for premium browsing pacing
      const amount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const browseCategory = categoryMap[title] || title;
  const subtitle = categorySubtitles[title] || 'Handpicked dossier collections';

  return (
    <div className="shelf-wrapper">
      {/* Shelf Header */}
      <div className="shelf-header">
        <div className="shelf-title-area">
          <h2 className="shelf-title">
            <span className="accent">//</span> {title}
          </h2>
          <span className="shelf-subtitle">{subtitle}</span>
        </div>
        <Link to={`/browse?category=${browseCategory}`} className="shelf-see-all">
          See All
        </Link>
      </div>

      {/* Scrollable Track Container */}
      <div className="shelf-track-container">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className={`shelf-arrow shelf-arrow-left ${showLeftArrow ? 'visible' : ''}`}
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* The horizontal scroll track */}
        <div className="shelf-track" ref={trackRef}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className={`shelf-arrow shelf-arrow-right ${showRightArrow ? 'visible' : ''}`}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default CategoryRow;
