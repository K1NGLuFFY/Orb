import React from 'react';

/**
 * Reusable full-screen loading overlay.
 */
const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'var(--ink, #0B0C10)',
      color: 'var(--text, #EDEEF0)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--signal, #C8FF00)' }}>
        LOADING SYSTEM ARCHIVES...
      </div>
    </div>
  );
};

export default LoadingScreen;
