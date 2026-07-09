import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ transparent, scrolled, topOffset }) => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navStyle = {
    position: transparent ? 'fixed' : 'sticky',
    top: topOffset || 0,
    left: 0,
    right: 0,
    height: '70px',
    backgroundColor: transparent
      ? (scrolled ? 'var(--panel)' : 'transparent')
      : 'var(--panel)',
    borderBottom: transparent
      ? (scrolled ? '1px solid var(--hairline)' : '1px solid transparent')
      : '1px solid var(--hairline)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2rem',
    zIndex: 100,
    transition: 'background-color 0.3s ease, border-color 0.3s ease, top 0.3s ease'
  };

  return (
    <nav style={navStyle}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-text">ORBIT</span>
          <span className="navbar-logo-badge">V1.0</span>
        </Link>

        {/* Hamburger button (mobile only) */}
        <button
          className="hamburger-btn navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            width: '44px',
            height: '44px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: '1px solid var(--hairline)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <span className={'hamburger-line' + (menuOpen ? ' open-1' : '')}></span>
          <span className={'hamburger-line' + (menuOpen ? ' open-2' : '')}></span>
          <span className={'hamburger-line' + (menuOpen ? ' open-3' : '')}></span>
        </button>

        {/* Nav links + auth - collapsible on mobile */}
        <div className={'navbar-menu' + (menuOpen ? ' open' : '')}>
          {/* Links */}
          <div className="navbar-links">
            <Link to="/browse" onClick={() => setMenuOpen(false)}>Browse</Link>
            <Link to="/browse?category=Book" onClick={() => setMenuOpen(false)}>Books</Link>
            <Link to="/browse?category=Anime" onClick={() => setMenuOpen(false)}>Anime</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
          </div>

          {/* Auth CTA */}
          <div className="navbar-auth">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    minHeight: '44px',
                    padding: '0.5rem 1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem 1rem'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
