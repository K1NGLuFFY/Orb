import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route protection wrapper.
 * @param {JSX.Element} children The component to render if allowed
 * @param {string[]} allowedRoles Array of roles authorized to view this route (e.g. ['Admin', 'Staff'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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
  }

  // Not authenticated
  if (!currentUser) {
    // Redirect to login, saving the original requested URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Role unauthorized
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
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', color: 'var(--signal, #C8FF00)', marginBottom: '1rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-muted, #8B8E96)', maxWidth: '450px', marginBottom: '2rem' }}>
          You don't have access to this page. Verify your permissions or log in under a different catalog role.
        </p>
        <a href="/" style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--signal, #C8FF00)',
          color: 'var(--signal-text, #0B0C10)',
          textDecoration: 'none',
          fontWeight: 'bold',
          borderRadius: '4px'
        }}>
          Return to Shelf
        </a>
      </div>
    );
  }

  // All checks passed, render children
  return children;
};

export default ProtectedRoute;
