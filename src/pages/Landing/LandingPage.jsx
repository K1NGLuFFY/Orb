import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storageHelper } from '../../utils/storageHelper';
import Navbar from '../../components/Common/Navbar';
import HeroBanner from '../../components/Common/HeroBanner';
import CategoryRow from '../../components/Common/CategoryRow';

import { getPopularMovies } from '../../services/tmdbApi';
import { getPopularAnime } from '../../services/jikanApi';
import { getPopularBooks } from '../../services/googleBooksApi';
import { getPopularManga } from '../../services/mangaApi';
import { getPopularComics } from '../../services/comicApi';
import { useProductStockSubscription } from '../../hooks/useProductStockSubscription';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [announcementTicker, setAnnouncementTicker] = useState('');

  // Data states
  const [localProducts, setLocalProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Load local and fetch live popular products
  useEffect(() => {
    // 1. Scroll listener
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    let active = true;
    const controller = new AbortController();

    async function loadLandingData() {
      setLoading(true);
      try {
        const [dbProducts, settings, results] = await Promise.all([
          storageHelper.getProducts(),
          storageHelper.getSettings().catch(() => ({})),
          Promise.allSettled([
            getPopularMovies(controller.signal),
            getPopularAnime(controller.signal),
            getPopularBooks(controller.signal),
            getPopularManga(controller.signal),
            getPopularComics(controller.signal)
          ])
        ]);

        if (!active) return;

        if (dbProducts) {
          setLocalProducts(dbProducts);
        }
        if (settings && settings.announcement_ticker) {
          setAnnouncementTicker(settings.announcement_ticker);
        }

        const popular = [];
        const apiResults = results;
        apiResults.forEach(res => {
          if (res.status === 'fulfilled') {
            popular.push(...res.value);
          }
        });

        setPopularProducts(popular);
      } catch (err) {
        console.error('Failed to load landing page data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLandingData();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      active = false;
      controller.abort();
    };
  }, []);

  const combinedProducts = [...localProducts, ...popularProducts];

  // Group catalog into categories
  const movies = combinedProducts.filter(p => p.category === 'Movie');
  const anime = combinedProducts.filter(p => p.category === 'Anime');
  const books = combinedProducts.filter(p => p.category === 'Book');
  const comics = combinedProducts.filter(p => p.category === 'Comic');
  const manga = combinedProducts.filter(p => p.category === 'Manga');

  // Curate a featured item for the Hero Banner
  const getFeaturedItem = () => {
    if (combinedProducts.length === 0) return null;
    const choices = combinedProducts.filter(p => p.imageUrl && (p.category === 'Movie' || p.category === 'Anime'));
    if (choices.length > 0) {
      return choices.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    }
    return combinedProducts[0];
  };

  const featuredItem = getFeaturedItem();

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 1. FIXED NAVBAR */}
      <Navbar />

      {/* 2. PAGE LAYOUT WRAPPER */}
      <div className="landing-layout animate-fade-in-up">
        
        {/* Announcement Ticker Banner (flows underneath Navbar, scrolls away naturally) */}
        {announcementTicker && (
          <div className="announcement-banner">
            {announcementTicker}
          </div>
        )}

        {/* 3. IMMERSIVE HERO BANNER */}
        <HeroBanner products={combinedProducts} />
      </div>

      {/* Pulse Keyframes style */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
      `}</style>

      {/* 3. CATEGORY ROWS */}
      <section style={{
        padding: '3rem 0',
        backgroundColor: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        {loading ? (
          <div style={{ padding: '4rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ height: '30px', background: 'var(--panel)', width: '200px', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'hidden' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: '160px', height: '240px', background: 'var(--panel)', borderRadius: '6px', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <CategoryRow title="Movies" products={movies} />
            <CategoryRow title="Anime" products={anime} />
            <CategoryRow title="Books" products={books} />
            <CategoryRow title="Manga" products={manga} />
            <CategoryRow title="Comics" products={comics} />
          </>
        )}
      </section>

      {/* 4. CLOSING CTA BANNER */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: 'var(--panel)',
        textAlign: 'center',
        position: 'relative',
        borderTop: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', zIndex: 5, position: 'relative' }}>
          <h2 className="display-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            EXPAND YOUR SHELF TODAY
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
            Join a clean, client-side, zero-database marketplace dedicated to high-quality print and media preservation.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}
          >
            Explore Catalog
          </button>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer style={{
        padding: '4rem 2rem 2rem',
        backgroundColor: 'var(--ink)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          <div>
            <h4 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              ORBIT
            </h4>
            <p style={{ lineHeight: '1.6' }}>
              A simulated React physical-media repository catalog. Powered by Supabase for authentication and database persistence.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '1rem' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/browse?category=Anime">Anime Shelf</Link>
              <Link to="/browse?category=Manga">Manga Archives</Link>
              <Link to="/browse?category=Book">Rare Books</Link>
              <Link to="/browse?category=Comic">Comics & Graphic Novels</Link>
              <Link to="/browse?category=Movie">Cinema Releases</Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '1rem' }}>
              Account Access
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/login">Log In</Link>
              <Link to="/register">Create Account</Link>
              <Link to="/register?role=Seller">Seller Registration</Link>
            </div>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '2rem',
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <span>&copy; 2026 Orbit Catalog Inc. Simulated transactions only.</span>
          <span style={{ fontSize: '0.75rem', maxWidth: '400px', textAlign: 'right' }}>
            Disclaimer: Powered by Supabase. This product uses sample artwork references but does not establish commercial sales.
          </span>
        </div>
      </footer>


    </div>
  );
};

export default LandingPage;
