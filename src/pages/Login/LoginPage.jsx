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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Helper function to auto-fill for testing/demo
  const handleAutoFill = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setLocalError('');
  };

  return (
    <div style={{
      background: 'var(--ink)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-body)'
    }}>
      
      {/* Brand Back link */}
      <Link to="/" style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2rem',
        color: 'var(--signal)',
        marginBottom: '2rem',
        textDecoration: 'none',
        letterSpacing: '0.05em'
      }}>
        ORBIT MARKETPLACE
      </Link>

      {/* Main card */}
      <div className="login-card">
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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="e.g. buyer1@orbit.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
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

        {/* Subtle hint trigger for guest credentials */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'color 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--text)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            Reviewing this portfolio project? View Guest Credentials
          </button>
        </div>

        {/* Demo Quick Credentials */}
        <div className="demo-credentials">
          <span className="demo-title">
            Demo Quick Credentials
          </span>

          <div className="demo-grid">
            <button 
              onClick={() => handleAutoFill('buyer1@orbit.com', 'buyer123')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem' }}
            >
              Buyer (Alice)
            </button>
            <button 
              onClick={() => handleAutoFill('seller1@orbit.com', 'seller123')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem' }}
            >
              Seller (Tokyo Imports)
            </button>
            <button 
              onClick={() => handleAutoFill('staff@orbit.com', 'staff123')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem' }}
            >
              Staff Curator
            </button>
            <button 
              onClick={() => handleAutoFill('admin@orbit.com', 'admin123')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem' }}
            >
              Admin Master
            </button>
          </div>
        </div>

      </div>

      {/* Guest Credentials Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(80, 61, 66, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          {/* Modal Container */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Top Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                lineHeight: 1
              }}
              onMouseOver={(e) => e.target.style.color = 'var(--text)'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              &times;
            </button>

            {/* Modal Header */}
            <div>
              <h3 className="display-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem', color: 'var(--text)' }}>
                Guest Access Keys
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Select a profile role below. The system will automatically configure credentials and synchronize the shelf ledger.
              </p>
            </div>

            {/* Credentials List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  role: 'Admin Master',
                  email: 'admin@orbit.com',
                  pass: 'admin123',
                  desc: 'Full configuration access: settings, curated staff, and full catalog control.',
                  color: 'var(--spine-anime)'
                },
                {
                  role: 'Staff Curator',
                  email: 'staff@orbit.com',
                  pass: 'staff123',
                  desc: 'Catalog curation: lock/unlock profiles, review database, manage active items.',
                  color: 'var(--spine-books)'
                },
                {
                  role: 'Seller (Tokyo Imports)',
                  email: 'seller1@orbit.com',
                  pass: 'seller123',
                  desc: 'Merchant operations: add listings, track sales ledger, and manage inventory.',
                  color: 'var(--spine-manga)'
                },
                {
                  role: 'Buyer (Alice)',
                  email: 'buyer1@orbit.com',
                  pass: 'buyer123',
                  desc: 'Customer portal: browse, build wishlist, purchase items, and download receipts.',
                  color: 'var(--spine-movies)'
                }
              ].map((cred, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    handleAutoFill(cred.email, cred.pass);
                    setIsModalOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    background: 'var(--ink)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--panel-raised)';
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ink)';
                    e.currentTarget.style.borderColor = 'var(--hairline)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Left Spine Accent */}
                  <div style={{
                    width: '6px',
                    backgroundColor: cred.color,
                    flexShrink: 0
                  }} />

                  {/* Details */}
                  <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                        {cred.role}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--signal)', 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: 'var(--font-body)'
                      }}>
                        Select
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>
                        Email: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{cred.email}</span>
                      </div>
                      <div>
                        Pass: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{cred.pass}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3', marginTop: '0.15rem', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                      {cred.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
