// src/hooks/useDeleteAccount.js
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook for deleting the current user's own account.
 *
 * Usage:
 *   const { deleteAccount, deleting, deleteError } = useDeleteAccount();
 *   await deleteAccount();   // returns true on success, false on failure
 */
export const useDeleteAccount = () => {
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const deleteAccount = useCallback(async () => {
        setDeleting(true);
        setDeleteError(null);

        try {
            // 1. Call the SQL function to stamp deleted_at and anonymize name
            const { error: rpcError } = await supabase.rpc('delete_own_account');

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            // 2. Sign out of the current browser session
            //    onAuthStateChange(SIGNED_OUT) will fire → AuthContext clears currentUser
            await supabase.auth.signOut();

            return true;

        } catch (err) {
            console.error('[useDeleteAccount]', err);
            setDeleteError(err.message || 'Failed to delete account. Please try again.');
            return false;

        } finally {
            setDeleting(false);
        }
    }, []);

    return { deleteAccount, deleting, deleteError };
};
