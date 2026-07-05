import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { readStorage, KEYS } from '../../utils/localStorage';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/Common/ProductCard';
import Navbar from '../../components/Common/Navbar';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Products source of truth
  const [products, setProducts] = useState([]);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest'); // newest | oldest | price-asc | price-desc | rating

  // Load products
  useEffect(() => {
    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    setProducts(dbProducts);

    // Sync categories from URL params if updated
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);

    const sortParam = searchParams.get('sort');
    if (sortParam) setSortBy(sortParam);
  }, [searchParams]);

  // Extract unique genres across catalog
  const genres = ['All', ...new Set(products.map(p => p.genre.split(',')).flat().map(g => g.trim()))];

  // Apply filters and sorting
  const filteredProducts = products.filter(product => {
    // Search filter (title, creator, genre, category)
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      product.title.toLowerCase().includes(query) ||
      product.creator.toLowerCase().includes(query) ||
      product.genre.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    // Category filter
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    // Genre filter
    const matchesGenre = selectedGenre === 'All' || product.genre.includes(selectedGenre);

    // Price filter
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;

    // Stock filter
    const matchesStock = !inStockOnly || product.stock > 0;

    return matchesSearch && matchesCategory && matchesGenre && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      return b.price - a.price;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Handle category selector click
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Sync with URL params
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  // Sync search input with URL params
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val === '') {
      newParams.delete('q');
    } else {
      newParams.set('q', val);
    }
    setSearchParams(newParams);
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Navbar />

      {/* Main Browse shelf layout */}
      <div style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '2.5rem',
      }} className="browse-layout">
        
        {/* LEFT COLUMN: FILTERS & NAVIGATION */}
        <aside style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['All', 'Anime', 'Manga', 'Book', 'Comic', 'Movie'].map(cat => {
                const isSelected = selectedCategory === cat;
                const dotColor = categoryColors[cat] || 'var(--signal)';
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    style={{
                      textAlign: 'left',
                      background: isSelected ? 'var(--panel-raised)' : 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      opacity: isSelected ? 1 : 0.4
                    }} />
                    {cat === 'Book' ? 'Books' : cat === 'Comic' ? 'Comics' : cat === 'Movie' ? 'Movies' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Filter By
            </h3>
            
            {/* Genre Select */}
            <div className="form-group">
              <label className="form-label">Genre</label>
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="form-select"
                style={{ cursor: 'pointer' }}
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Price</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal)' }}>${priceRange.max}</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: parseFloat(e.target.value) })}
                style={{ 
                  width: '100%', 
                  accentColor: 'var(--signal)',
                  background: 'var(--panel)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Availability */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                id="stock-check"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ accentColor: 'var(--signal)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="stock-check" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                In Stock Only
              </label>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: SEARCH & CATALOG GRID */}
        <main>
          {/* Top Search & Sort Panel */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search titles, creators, genres..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="form-input"
                style={{
                  paddingLeft: '1rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Sort Select */}
            <div style={{ width: '180px' }}>
              <select 
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('sort', e.target.value);
                  setSearchParams(newParams);
                }}
                className="form-select"
                style={{ cursor: 'pointer' }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            Showing {filteredProducts.length} of {products.length} catalog items
          </div>

          {/* Shelf Grid */}
          {filteredProducts.length > 0 ? (
            <div 
              className="catalog-grid"
              style={{
                backgroundImage: 'linear-gradient(to bottom, transparent calc(100% - 2px), var(--hairline) calc(100% - 2px))',
                backgroundSize: '100% 390px', /* Shelving effect line */
                padding: '12px 0 24px 0' /* Adjust padding to fit page structure perfectly */
              }}
            >
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '6rem 2rem',
              background: 'var(--panel)',
              border: '1px dashed var(--hairline)',
              borderRadius: '6px',
              marginTop: '1rem'
            }}>
              <p style={{
                color: 'var(--text)',
                fontSize: '1.15rem',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-body)'
              }}>
                Nothing matches '{searchQuery || selectedCategory}'. Try a different title, creator, or genre.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--hairline)',
        backgroundColor: 'var(--panel)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        <span>&copy; 2026 Orbit Catalog. Simulated client-side transaction framework.</span>
      </footer>

    </div>
  );
};

export default BrowsePage;
