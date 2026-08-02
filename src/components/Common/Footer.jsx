import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="polished-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="logo">ORBIT</span>
          <p>
            A simulated React physical-media repository catalog. Powered by Supabase for authentication and database persistence.
          </p>
        </div>

        <div>
          <h4 className="footer-column-title">Categories</h4>
          <div className="footer-links">
            <Link to="/browse?category=Anime">Anime Shelf</Link>
            <Link to="/browse?category=Manga">Manga Archives</Link>
            <Link to="/browse?category=Book">Rare Books</Link>
            <Link to="/browse?category=Comic">Comics & Graphic Novels</Link>
            <Link to="/browse?category=Movie">Cinema Releases</Link>
          </div>
        </div>

        <div>
          <h4 className="footer-column-title">Account Access</h4>
          <div className="footer-links">
            <Link to="/login">Log In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/register?role=Seller">Seller Registration</Link>
          </div>
        </div>
        
        <div>
          <h4 className="footer-column-title">Company</h4>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 Orbit Catalog Inc. Simulated transactions only.</span>
        <span style={{ maxWidth: '400px', textAlign: 'right' }}>
          Disclaimer: Powered by Supabase. This product uses sample artwork references but does not establish commercial sales.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
