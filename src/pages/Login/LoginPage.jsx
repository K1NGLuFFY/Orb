import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, authError } = useAuth();

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };


  return (
    <div className="auth-page-container animate-fade-in-up">
      {/* Brand Back link */}
      <Link 
        to="/" 
        className="display-title" 
        style={{
          fontSize: '2rem',
          color: 'var(--signal)',
          marginBottom: '2rem',
          textDecoration: 'none',
          letterSpacing: '0.05em'
        }}
      >
        ORBIT MARKETPLACE
      </Link>

      {/* Main card */}
      <div className="auth-card">
        {/* Spine design dot */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: '4px',
          width: '60px',
          backgroundColor: 'var(--signal)',
          borderRadius: '0 0 4px 4px'
        }} />

        <h2 className="display-title" style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '0.5rem', textAlign: 'center' }}>
          Access Archive
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          Input your credentials to synchronize with the shelf ledger.
        </p>

        {/* Errors */}
        {(authError || localError) && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(230, 57, 70, 0.15)',
            border: '1px solid #e63946',
            color: '#ff6b76',
            borderRadius: '4px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}>
            {localError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="e.g. buyer1@orbit.com"
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Synchronizing...' : 'Log In to Dashboard'}
          </button>
        </form>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
