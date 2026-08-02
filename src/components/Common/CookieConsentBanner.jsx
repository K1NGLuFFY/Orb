import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
      document.body.classList.add('cookie-banner-visible');
    }
  }, []);

  const handleConsent = (type) => {
    localStorage.setItem('cookie_consent', type);
    setIsVisible(false);
    document.body.classList.remove('cookie-banner-visible');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: 'var(--panel-raised)',
      borderTop: '1px solid var(--hairline)',
      padding: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.8)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>We Value Your Privacy</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            We use cookies to improve your experience and keep you signed in. By using Orbit, you agree to our use of cookies. 
            {' '}<Link to="/privacy" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Read our Privacy Policy.</Link>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flex: '0 0 auto' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => handleConsent('necessary')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Necessary Only
          </button>
          <button 
            className="btn btn-primary"
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
