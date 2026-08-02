import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (type) => {
    localStorage.setItem('cookie_consent', type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>We Value Your Privacy</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            We use cookies to improve your experience and keep you signed in. By using Orbit, you agree to our use of cookies. 
            {' '}<Link to="/privacy" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Read our Privacy Policy.</Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flex: '0 0 auto' }}>
          <button 
            className="btn-secondary"
            onClick={() => handleConsent('necessary')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Necessary Only
          </button>
          <button 
            className="btn-primary"
            onClick={() => handleConsent('all')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
