import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readStorage, KEYS } from '../../utils/localStorage';
import ProductCard from '../../components/Common/ProductCard';
import Navbar from '../../components/Common/Navbar';

const categoryColors = {
  Anime: 'var(--spine-anime)',
  Manga: 'var(--spine-manga)',
  Book: 'var(--spine-books)',
  Comic: 'var(--spine-comics)',
  Movie: 'var(--spine-movies)'
};

const LandingPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [products, setProducts] = useState([]);
  const [bestsellerFilter, setBestsellerFilter] = useState('All');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [announcementTicker, setAnnouncementTicker] = useState('');

  // Monitor scroll for nav transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Check media queries for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const motionListener = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionListener);

    // Read products from localStorage
    const localProducts = readStorage(KEYS.PRODUCTS) || [];
    setProducts(localProducts);

    // Read announcement ticker from settings
    const settings = readStorage(KEYS.SETTINGS) || {};
    setAnnouncementTicker(settings.announcementTicker || '');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', motionListener);
    };
  }, []);

  // Compute fanned hero items (3-5 real covers)
  const heroProducts = products.filter(p => p.imageUrl).slice(0, 4);

  // New Releases (Sorted by date, newest first)
  const newReleases = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  // Bestsellers (Sorted by rating)
  const allBestsellers = [...products].sort((a, b) => b.rating - a.rating);
  
  // Filter bestsellers based on category pill
  const filteredBestsellers = bestsellerFilter === 'All'
    ? allBestsellers.slice(0, 4)
    : allBestsellers.filter(p => p.category === bestsellerFilter || (bestsellerFilter === 'Books' && p.category === 'Book') || (bestsellerFilter === 'Comics' && p.category === 'Comic') || (bestsellerFilter === 'Movies' && p.category === 'Movie')).slice(0, 4);

  // Categories for filter pills
  const categories = ['All', 'Anime', 'Manga', 'Book', 'Comic', 'Movie'];

  const getPillLabel = (cat) => {
    if (cat === 'Book') return 'Books';
    if (cat === 'Comic') return 'Comics';
    if (cat === 'Movie') return 'Movies';
    return cat;
  };

  const getPillColor = (cat) => {
    if (cat === 'All') return 'var(--signal)';
    if (cat === 'Book') return categoryColors.Book;
    if (cat === 'Comic') return categoryColors.Comic;
    if (cat === 'Movie') return categoryColors.Movie;
    return categoryColors[cat];
  };

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Announcement Ticker Banner */}
      {announcementTicker && (
        <div style={{
          backgroundColor: 'var(--signal)',
          color: 'var(--signal-text)',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-mono)',
          padding: '0.4rem 1rem',
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {announcementTicker}
        </div>
      )}

      {/* 1. TOP NAV */}
      <Navbar transparent scrolled={scrolled} topOffset={announcementTicker ? '29px' : 0} />

      {/* 2. HERO */}
      <header style={{
        paddingTop: announcementTicker ? '100px' : '70px',
        backgroundColor: 'var(--ink)',
        borderBottom: '1px solid var(--hairline)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle noise/film-grain overlay */}
        <div className="noise-overlay" />

        {/* Animated grid lines behind hero */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(var(--hairline) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.25,
          pointerEvents: 'none'
        }} />

        <div className="heroContainer">
          {/* Hero Left: Headline & CTAs */}
          <div className="heroText">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontFamily: 'var(--font-mono)'
              }}>
                // ARCHIVE CATALOG
              </div>
              <div className="collector-stamp">
                NO. 0041 — VERIFIED FIRST PRINT
              </div>
            </div>
            
            <h1 className="heroHeadline">
              <span className="line-sub">MINT CONDITION.</span>
              <span className="line-sub">FIRST-PRINTS.</span>
              <span className="line-main">YOUR SHELF.</span>
            </h1>

            <p className="heroSubtext">
              Orbit is the decentralized shelf-space for physical media purists. Scout first-print manga volumes, rare anime box sets, back-catalog fiction, and vintage film pressings. Curated by collectors, simulated locally.
            </p>

            <div className="buttonGroup">
              <button 
                onClick={() => navigate('/browse')}
                className="primaryBtn"
              >
                Browse the Catalog
              </button>
              <button 
                onClick={() => navigate('/register?role=Seller')}
                className="secondaryBtn"
              >
                Sign Up to Sell
              </button>
            </div>
          </div>

          {/* Hero Right: Vector catalog ledger list */}
          <div className="heroImages">
            <div className="catalog-ledger">
              <div className="ledger-header">
                <span>REF. ID</span>
                <span>ITEM DESCRIPTION</span>
                <span>VALUATION</span>
              </div>
              <div className="ledger-row">
                <span className="tag">[MNG-001]</span>
                <span className="title">BERSERK DELUXE VOL. 1</span>
                <span className="price">$14.99</span>
              </div>
              <div className="ledger-row">
                <span className="tag">[MOV-2049]</span>
                <span className="title">BLADE RUNNER 2049 BR</span>
                <span className="price">$24.99</span>
              </div>
              <div className="ledger-row">
                <span className="tag">[ANM-1995]</span>
                <span className="title">NEON GENESIS BOXSET</span>
                <span className="price">$59.99</span>
              </div>
              <div className="ledger-row">
                <span className="tag">[BOK-1965]</span>
                <span className="title">DUNE FIRST EDITION</span>
                <span className="price">$35.00</span>
              </div>
              <div className="ledger-row">
                <span className="tag">[CMC-0082]</span>
                <span className="title">AKIRA VOLUME 1 (MINT)</span>
                <span className="price">$29.99</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. NEW RELEASES */}
      <section style={{
        padding: '5rem 2rem',
        borderBottom: '1px solid var(--hairline)',
        backgroundColor: 'var(--panel)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--signal)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                // CATALOG ADDITIONS
              </span>
              <h2 className="display-title" style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>
                Newest on the Shelf
              </h2>
            </div>
            <Link 
              to="/browse?sort=newest" 
              style={{
                color: 'var(--signal)',
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View all <span style={{ fontFamily: 'var(--font-mono)' }}>→</span>
            </Link>
          </div>

          <div className="catalog-grid" style={{ padding: '12px 0 24px 0' }}>
            {newReleases.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. BESTSELLERS ROW WITH CAT FILTER */}
      <section style={{
        padding: '5rem 2rem',
        borderBottom: '1px solid var(--hairline)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--signal)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)' }}>
                // TOP RATED MEDIA
              </span>
              <h2 className="display-title" style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>
                Bestseller Archives
              </h2>
            </div>

            {/* Pill filter bar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => {
                const isActive = bestsellerFilter === cat;
                const pillColor = getPillColor(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setBestsellerFilter(cat)}
                    style={{
                      backgroundColor: isActive ? 'var(--panel-raised)' : 'var(--panel)',
                      borderColor: isActive ? pillColor : 'var(--hairline)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: isActive ? 'var(--text)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Tiny category color dot (except for 'All') */}
                    {cat !== 'All' && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: pillColor
                      }} />
                    )}
                    {getPillLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Grid */}
          {filteredBestsellers.length > 0 ? (
            <div className="catalog-grid" style={{ padding: '12px 0 24px 0' }}>
              {filteredBestsellers.map(product => (
                <ProductCard key={product.id} product={product} overlayBadges={true} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--panel)',
              borderRadius: '6px',
              border: '1px dashed var(--hairline)'
            }}>
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                NO ARCHIVES FOUND FOR THIS FILTER.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. CLOSING CTA BANNER */}
      <section style={{
        padding: '6rem 2rem',
        backgroundColor: 'var(--panel)',
        textAlign: 'center',
        position: 'relative'
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

      {/* 6. FOOTER */}
      <footer style={{
        padding: '4rem 2rem 2rem',
        backgroundColor: 'var(--ink)',
        borderTop: '1px solid var(--hairline)',
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
              A simulated React physical-media repository catalog. Built frontend-only using localStorage.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '1rem' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/browse?category=Anime" style={{ hover: 'color: var(--text)' }}>Anime Shelf</Link>
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
            Disclaimer: Authentication is simulated using localStorage. This product uses sample artwork references but does not establish commercial sales.
          </span>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
