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
      const amount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const browseCategory = categoryMap[title] || title;
  const subtitle = categorySubtitles[title] || 'Handpicked dossier collections';

  return (
    <div className="category-row-section">
      <div className="category-row-header">
        <h2 className="category-row-title">
          <span>//</span> {title}
        </h2>
        <Link to={`/browse?category=${browseCategory}`} className="category-row-see-all">
          Explore All {'>'}
        </Link>
      </div>

      <div className="category-row-container">
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="scroll-arrow-btn left"
            aria-label="Scroll left"
          >
            &lt;
          </button>
        )}

        <div className="category-scroll-area" ref={trackRef}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {showRightArrow && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="scroll-arrow-btn right"
            aria-label="Scroll right"
          >
            &gt;
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryRow;
