import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storageHelper } from '../../utils/storageHelper';
import ProductCard from '../../components/Common/ProductCard';
import ProductGrid from '../../components/Common/ProductGrid';
import Navbar from '../../components/Common/Navbar';
import Footer from '../../components/Common/Footer';
import SkeletonCard from '../../components/Common/SkeletonCard';
import EmptyState from '../../components/Common/EmptyState';
import { getPopularMovies, searchMovies } from '../../services/tmdbApi';
import { getPopularAnime, searchAnime } from '../../services/jikanApi';
import { getPopularBooks, searchBooks } from '../../services/googleBooksApi';
import { getPopularManga, searchManga } from '../../services/mangaApi';
import { getPopularComics, searchComics } from '../../services/comicApi';
import { useProductStockSubscription } from '../../hooks/useProductStockSubscription';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [localProducts, setLocalProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loadingPopular, setLoadingPopular] = useState(false);

  // ── Realtime: patch stock for seeded products when updated in DB ──────────
  const handleStockUpdate = useCallback((updatedProduct) => {
    setLocalProducts(prev =>
      prev.map(p =>
        p.id === updatedProduct.id
          ? { ...p, stock: updatedProduct.stock }
          : p
      )
    );
  }, []);

  useProductStockSubscription(handleStockUpdate, localProducts.length > 0);
  const [moviesBooksSearching, setMoviesBooksSearching] = useState(false);
  const [animeSearching, setAnimeSearching] = useState(false);
  const [mangaSearching, setMangaSearching] = useState(false);
  const [comicsSearching, setComicsSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
    const sortParam = searchParams.get('sort');
    if (sortParam) setSortBy(sortParam);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadDbProducts() {
      try {
        const dbProducts = await storageHelper.getProducts();
        if (active) {
          setLocalProducts(dbProducts);
        }
      } catch (err) {
        console.error('Failed to load database products:', err);
      }
    }

    async function loadPopularData() {
      setLoadingPopular(true);
      setError(null);
      const results = await Promise.allSettled([
        getPopularMovies(controller.signal),
        getPopularAnime(controller.signal),
        getPopularBooks(controller.signal),
        getPopularManga(controller.signal),
        getPopularComics(controller.signal)
      ]);
      if (!active) return;
      const popular = [];
      let successCount = 0;
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          popular.push(...res.value);
          successCount++;
        }
      });
      setPopularProducts(popular);
      setLoadingPopular(false);
      if (successCount === 0) setError("All live catalog services failed to load. Falling back to local data only.");
    }

    loadDbProducts();
    loadPopularData();
    return () => { active = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setMoviesBooksSearching(false);
      setAnimeSearching(false);
      setMangaSearching(false);
      setComicsSearching(false);
      return;
    }
    setMoviesBooksSearching(true);
    setAnimeSearching(true);
    setMangaSearching(true);
    setComicsSearching(true);
    setError(null);
    const movieBookController = new AbortController();
    const animeController = new AbortController();
    const mangaController = new AbortController();
    const comicsController = new AbortController();
    
    const movieBookTimer = setTimeout(async () => {
      try {
        const [movies, books] = await Promise.all([
          searchMovies(searchQuery, movieBookController.signal),
          searchBooks(searchQuery, movieBookController.signal)
        ]);
        setSearchResults(prev => {
          const nonMovieBook = prev.filter(p => p.category !== 'Movie' && p.category !== 'Book');
          return [...nonMovieBook, ...movies, ...books];
        });
      } catch (err) { if (err.name !== 'AbortError') console.error(err); }
      finally { setMoviesBooksSearching(false); }
    }, 450);
    
    const animeTimer = setTimeout(async () => {
      try {
        const anime = await searchAnime(searchQuery, animeController.signal);
        setSearchResults(prev => {
          const nonAnime = prev.filter(p => p.category !== 'Anime');
          return [...nonAnime, ...anime];
        });
      } catch (err) { if (err.name !== 'AbortError') console.error(err); }
      finally { setAnimeSearching(false); }
    }, 600);

    const mangaTimer = setTimeout(async () => {
      try {
        const manga = await searchManga(searchQuery, mangaController.signal);
        setSearchResults(prev => {
          const nonManga = prev.filter(p => p.category !== 'Manga');
          return [...nonManga, ...manga];
        });
      } catch (err) { if (err.name !== 'AbortError') console.error(err); }
      finally { setMangaSearching(false); }
    }, 600);

    const comicsTimer = setTimeout(async () => {
      try {
        const comics = await searchComics(searchQuery, comicsController.signal);
        setSearchResults(prev => {
          const nonComics = prev.filter(p => p.category !== 'Comic');
          return [...nonComics, ...comics];
        });
      } catch (err) { if (err.name !== 'AbortError') console.error(err); }
      finally { setComicsSearching(false); }
    }, 450);
    
    return () => {
      clearTimeout(movieBookTimer);
      clearTimeout(animeTimer);
      clearTimeout(mangaTimer);
      clearTimeout(comicsTimer);
      movieBookController.abort();
      animeController.abort();
      mangaController.abort();
      comicsController.abort();
    };
  }, [searchQuery]);

  const normalizeText = (str) =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const combinedProducts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    if (!normalizedQuery) {
      const idSet = new Set(localProducts.map(p => p.id));
      const deduped = [...localProducts, ...popularProducts.filter(p => !idSet.has(p.id))];
      return deduped;
    }

    const matchesQuery = (product) => {
      const fields = [
        product.title,
        product.creator,
        product.genre,
        product.category,
        product.description,
      ];
      const combined = normalizeText(fields.join(' '));
      return combined.includes(normalizedQuery);
    };

    const matchingLocal = localProducts.filter(matchesQuery);
    const matchingApi = searchResults.filter(matchesQuery);

    const idSet = new Set(matchingLocal.map(p => p.id));
    return [...matchingLocal, ...matchingApi.filter(p => !idSet.has(p.id))];
  }, [searchQuery, localProducts, popularProducts, searchResults]);

  const genres = useMemo(() =>
    ['All', ...new Set(combinedProducts.map(p => (p.genre ? p.genre.split(',') : [])).flat().map(g => g.trim()).filter(Boolean))],
    [combinedProducts]
  );

  const filteredProducts = useMemo(() => {
    return combinedProducts.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesGenre = selectedGenre === 'All' || (product.genre && product.genre.includes(selectedGenre));
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
      const matchesStock = !inStockOnly || product.stock > 0;
      return matchesCategory && matchesGenre && matchesPrice && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [combinedProducts, selectedCategory, selectedGenre, priceRange, inStockOnly, sortBy]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') newParams.delete('category'); else newParams.set('category', category);
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    const newParams = new URLSearchParams(searchParams);
    if (val === '') newParams.delete('q'); else newParams.set('q', val);
    setSearchParams(newParams);
  };

  const isSearching = moviesBooksSearching || animeSearching || mangaSearching || comicsSearching;

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="browse-layout animate-fade-in-up">
        {/* Sidebar Filters */}
        <aside className="browse-sidebar">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['All', 'Anime', 'Manga', 'Book', 'Comic', 'Movie'].map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button 
                    key={cat} 
                    onClick={() => handleCategorySelect(cat)} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: isSelected ? '600' : 'normal',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '0.25rem 0',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: categoryColors[cat] || 'var(--signal)', 
                        opacity: isSelected ? 1 : 0.2 
                      }} 
                    />
                    {cat === 'Book' ? 'Books' : cat === 'Comic' ? 'Comics' : cat === 'Movie' ? 'Movies' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.2rem', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
              Filter By
            </h3>
            
            <div className="form-group">
              <label className="form-label">Genre</label>
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)} 
                className="form-select" 
                style={{ cursor: 'pointer' }}
              >
                {genres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
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
                style={{ width: '100%', accentColor: 'var(--signal)', background: 'var(--panel)', cursor: 'pointer' }} 
              />
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox" 
                id="stock-check" 
                checked={inStockOnly} 
                onChange={(e) => setInStockOnly(e.target.checked)} 
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--signal)',
                  cursor: 'pointer'
                }}
              />
              <label 
                htmlFor="stock-check" 
                style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text)', 
                  cursor: 'pointer', 
                  userSelect: 'none',
                  fontWeight: '500'
                }}
              >
                In Stock Only
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content Grid */}
        <main>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search titles, creators, genres..." 
                value={searchQuery} 
                onChange={handleSearchChange} 
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="form-input" 
                style={{ paddingLeft: '1rem', fontSize: '1rem' }} 
              />
              {isSearching && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--signal)' }}>
                  FETCHING...
                </div>
              )}
              {showSuggestions && searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'var(--panel)',
                  border: '1px solid var(--hairline)',
                  borderRadius: '6px',
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {filteredProducts.slice(0, 5).map(p => (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--hairline)',
                        textDecoration: 'none',
                        color: 'var(--text)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--panel-raised)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={p.imageUrl} alt={p.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.category} • ${p.price.toFixed(2)}</div>
                      </div>
                    </Link>
                  ))}
                  {filteredProducts.length === 0 && !isSearching && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
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

          {error && (
            <div style={{ backgroundColor: 'rgba(255, 77, 109, 0.1)', border: '1px solid var(--spine-anime)', color: 'var(--spine-anime)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: 'var(--spine-anime)', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            {loadingPopular ? 'RETRIEVING POPULAR DOSSIERS...' : `Showing ${filteredProducts.length} results`}
          </div>

          {loadingPopular ? (
            <ProductGrid>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ minWidth: '200px', height: '340px' }}>
                  <SkeletonCard />
                </div>
              ))}
            </ProductGrid>
          ) : filteredProducts.length > 0 ? (
            <ProductGrid>
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </ProductGrid>
          ) : (
            <EmptyState
              type="search"
              title="Nothing on this shelf"
              description={`Try a different search or browse other categories.`}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default BrowsePage;
