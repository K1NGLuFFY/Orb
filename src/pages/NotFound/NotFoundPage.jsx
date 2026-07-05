import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'var(--ink, #0B0C10)',
      color: 'var(--text, #EDEEF0)',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '3rem', color: 'var(--signal, #C8FF00)', marginBottom: '1.5rem' }}>
        404
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        This page isn't on the shelf.
      </p>
      <Link to="/" style={{
        padding: '0.75rem 1.5rem',
        background: 'var(--signal, #C8FF00)',
        color: 'var(--signal-text, #0B0C10)',
        textDecoration: 'none',
        fontWeight: 'bold',
        borderRadius: '4px'
      }}>
        Back to the Shelf
      </Link>
    </div>
  );
};

export default NotFoundPage;
