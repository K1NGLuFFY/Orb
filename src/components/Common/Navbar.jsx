import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Scroll listener for border and shadow transitions
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent page scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [menuOpen]);

  // Close menu on location change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isHomepage = location.pathname === '/';
  const navbarClass = `fixed-navbar ${scrolled ? 'scrolled' : ''} ${isHomepage ? 'homepage-nav' : ''}`;

  // Helper function to apply the active class based on route paths and categories
  const getLinkClass = (path, category = null) => {
    const searchParams = new URLSearchParams(location.search);
    const currentCategory = searchParams.get('category');

    if (path === '/browse') {
      if (category) {
        return currentCategory === category ? 'active' : '';
      } else {
        return location.pathname === '/browse' && !currentCategory ? 'active' : '';
      }
    }

    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={navbarClass}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="navbar-logo-text">ORBIT</span>
          <span className="navbar-logo-badge">V1.1</span>
        </Link>

        {/* Collapsible drawer container and links */}
        <div className={`navbar-menu mobile-drawer ${menuOpen ? 'is-open' : ''}`}>
          <div className="navbar-links">
            <Link 
              to="/browse" 
              className={getLinkClass('/browse')} 
              onClick={() => setMenuOpen(false)}
            >
              Browse
            </Link>
            <Link 
              to="/browse?category=Book" 
              className={getLinkClass('/browse', 'Book')} 
              onClick={() => setMenuOpen(false)}
            >
              Books
            </Link>
            <Link 
              to="/browse?category=Anime" 
              className={getLinkClass('/browse', 'Anime')} 
              onClick={() => setMenuOpen(false)}
            >
              Anime
            </Link>
            <Link 
              to="/cart" 
              className={getLinkClass('/cart')} 
              onClick={() => setMenuOpen(false)}
            >
              Cart
            </Link>
          </div>

          <div className="navbar-auth">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="btn btn-secondary"
                  style={{ 
                    background: 'transparent', 
                    borderColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    padding: '0.4rem 1rem'
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="login-btn-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary register-btn-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button
          className={`hamburger-btn navbar-hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${menuOpen ? 'open-1' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-2' : ''}`} />
          <span className={`hamburger-line ${menuOpen ? 'open-3' : ''}`} />
        </button>
      </div>

      {/* Slide drawer overlay backdrop */}
      <div
        className={`drawer-backdrop ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
