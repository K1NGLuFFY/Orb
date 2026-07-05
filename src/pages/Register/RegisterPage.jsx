import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readStorage, KEYS } from '../../utils/localStorage';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, currentUser, authError } = useAuth();

  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Buyer'); // Buyer | Seller
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [registrationsAllowed, setRegistrationsAllowed] = useState(true);

  // Check if system settings block new accounts
  useEffect(() => {
    const settings = readStorage(KEYS.SETTINGS) || {};
    if (settings.allowNewRegistrations === false) {
      setRegistrationsAllowed(false);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!registrationsAllowed) {
      setLocalError('System Registrations are temporarily locked by Administration.');
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill out all registration fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await register(name, email, password, role);
    setLoading(false);

    if (success) {
      navigate('/dashboard', { replace: true });
    }
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
      
      {/* Title */}
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

      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--hairline)',
        borderRadius: '6px',
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        
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
          Enroll Account
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '2rem' }}>
          Create a Buyer or Seller keyset to access trade shelves.
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

        {!registrationsAllowed ? (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            border: '1px dashed var(--hairline)',
            borderRadius: '4px',
            color: 'var(--text-muted)'
          }}>
            Registrations are locked. Please contact staff or check back later.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name / Store Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g. Alice Smith"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. email@domain.com"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Roster Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Buyer">Buyer (Buy items)</option>
                  <option value="Seller">Seller (Sell items)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create Account & Log In'}
            </button>
          </form>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>
            Log in here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterPage;
