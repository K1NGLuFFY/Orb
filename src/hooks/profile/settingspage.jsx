import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import { useNavigate } from 'react-router-dom';

// Inside your component:
const { deleteAccount, deleting, deleteError } = useDeleteAccount();
const navigate = useNavigate();

const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to permanently delete your account? This cannot be undone.'
  );
  if (!confirmed) return;

  const success = await deleteAccount();
  if (success) {
    // User is now signed out. onAuthStateChange fires and clears AuthContext.
    navigate('/');
  }
};

// In JSX:
<button
  onClick={handleDeleteAccount}
  disabled={deleting}
  style={{ color: '#e63946', background: 'transparent', border: '1px solid #e63946', borderRadius: '4px', padding: '0.6rem 1.5rem', cursor: 'pointer' }}
>
  {deleting ? 'Deleting...' : 'Delete My Account'}
</button>

{deleteError && (
  <p style={{ color: '#e63946', marginTop: '0.5rem', fontSize: '0.9rem' }}>
    {deleteError}
  </p>
)}
