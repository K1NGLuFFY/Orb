// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Fetch the profiles row for a given auth user id.
 * Returns null if the profile doesn't exist yet (e.g., trigger delay) or is soft-deleted.
 */
const fetchProfile = async (userId) => {
  console.log(`[fetchProfile] Querying profiles table for userId: "${userId}"`);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, status, deleted_at')
    .eq('id', userId)
    .single();

  console.log(`[fetchProfile] Query result for userId: "${userId}" - Data:`, data, 'Error:', error);

  if (error || !data) {
    console.warn(`[fetchProfile] Profile fetch failed or returned empty for userId: "${userId}". Error object:`, error);
    return null;
  }
  // Treat soft-deleted accounts as logged out
  if (data.deleted_at) {
    console.warn(`[fetchProfile] Profile is soft-deleted (deleted_at: ${data.deleted_at}) for userId: "${userId}"`);
    return null;
  }
  console.log(`[fetchProfile] Profile successfully retrieved:`, data);
  return data;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Auto-clear auth errors after 4 s
  const clearErrorAfterDelay = useCallback(() => {
    setTimeout(() => setAuthError(null), 4000);
  }, []);

  // ── Session bootstrap + live auth listener ────────────────────────────────
  useEffect(() => {
    // 1. Check for an existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(
          profile
            ? { ...profile, email: session.user.email }
            : null
        );
      }
      setLoading(false);
    });

    // 2. Subscribe to future auth events (tab refresh, token refresh, signout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setCurrentUser(
            profile
              ? { ...profile, email: session.user.email }
              : null
          );
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Re-fetch profile if auth metadata changed
          const profile = await fetchProfile(session.user.id);
          setCurrentUser(
            profile
              ? { ...profile, email: session.user.email }
              : null
          );
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  /**
   * Sign in with email + password.
   * Returns true on success, false on failure (error set in authError).
   */
  const login = async (email, password) => {
    console.log(`[Auth Login] Initiating login for email: "${email}"`);
    setAuthError(null);

    console.log('[Auth Login] Calling supabase.auth.signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    console.log('[Auth Login] signInWithPassword response - Data:', data, 'Error:', error);

    if (error) {
      console.error('[Auth Login] Authentication failed with error:', error);
      // Map Supabase error messages to user-friendly ones
      if (error.message.toLowerCase().includes('invalid login')) {
        setAuthError("Incorrect email or password. Try again.");
      } else {
        setAuthError(error.message);
      }
      clearErrorAfterDelay();
      return false;
    }

    console.log('[Auth Login] Authentication succeeded. User ID:', data.user.id);
    console.log('[Auth Login] Checking if profile exists in profiles table...');

    // Profile is set by onAuthStateChange listener above, but we also
    // check status here so the user sees an immediate rejection if locked.
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      console.warn('[Auth Login] No profile record found for user. Logging out to clean up session.');
      await supabase.auth.signOut();
      setAuthError("Account not found or has been deactivated.");
      clearErrorAfterDelay();
      return false;
    }

    console.log('[Auth Login] Profile record found:', profile);

    if (profile.status === 'locked' || profile.status === 'suspended') {
      console.warn(`[Auth Login] Profile status is "${profile.status}". Logging out.`);
      await supabase.auth.signOut();
      setAuthError(`This account has been ${profile.status}. Please contact support.`);
      clearErrorAfterDelay();
      return false;
    }

    console.log('[Auth Login] Login sequence completed successfully.');
    return true;
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  /**
   * Register a new user. Only 'Buyer' or 'Seller' roles are permitted.
   * The handle_new_user trigger (Step 1) auto-creates the profiles row.
   */
  const register = async (name, email, password, role) => {
    console.log(`[Auth Register] Initiating sign up for email: "${email}", name: "${name}", role: "${role}"`);
    setAuthError(null);

    if (role !== 'Buyer' && role !== 'Seller') {
      console.warn(`[Auth Register] Invalid role attempt: "${role}". Self-registration only permitted for Buyer or Seller.`);
      setAuthError("Invalid registration role. Only Buyers and Sellers may self-register.");
      clearErrorAfterDelay();
      return false;
    }

    console.log('[Auth Register] Calling supabase.auth.signUp with metadata...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }   // passed as raw_user_meta_data → picked up by trigger
      }
    });

    console.log('[Auth Register] signUp response - Data:', data, 'Error:', error);

    if (error) {
      console.error('[Auth Register] Registration failed with error:', error);
      if (error.message.toLowerCase().includes('already registered')) {
        setAuthError("This email is already registered. Try logging in.");
      } else {
        setAuthError(error.message);
      }
      clearErrorAfterDelay();
      return false;
    }

    console.log('[Auth Register] Registration request sent. User ID:', data.user?.id);
    console.log('[Auth Register] Checking if session is immediately active...');

    // If email confirmation is disabled in Supabase Auth settings,
    // the session is live immediately and onAuthStateChange fires.
    // If confirmation is enabled, data.session will be null — handle gracefully.
    if (!data.session) {
      console.log('[Auth Register] data.session is NULL. Email confirmation is likely enabled. User must confirm before logging in.');
      setAuthError("Check your email to confirm your account before logging in.");
      clearErrorAfterDelay();
      // Return true — registration succeeded, confirmation pending
      return true;
    }

    console.log('[Auth Register] data.session is active. User logged in immediately.');
    return true;
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    // setCurrentUser(null) is handled by the onAuthStateChange listener
  };

  // ── UPDATE PROFILE ────────────────────────────────────────────────────────
  /**
   * Update the current user's profile fields.
   * Allowed fields: name. Password change goes through Supabase Auth.
   * Role/status changes are admin-only and should use the Dashboard.
   */
  const updateProfile = async (updatedFields) => {
    if (!currentUser) return false;

    const profileUpdates = {};
    const authUpdates = {};

    if (updatedFields.name) profileUpdates.name = updatedFields.name;

    // Password update goes through Supabase Auth, not the profiles table
    if (updatedFields.password) {
      authUpdates.password = updatedFields.password;
    }

    // Email update goes through Supabase Auth
    if (updatedFields.email) {
      authUpdates.email = updatedFields.email;
    }

    // Apply auth-level updates first
    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await supabase.auth.updateUser(authUpdates);
      if (authErr) {
        setAuthError(authErr.message);
        clearErrorAfterDelay();
        return false;
      }
    }

    // Apply profile-row updates
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', currentUser.id);

      if (profileErr) {
        setAuthError(profileErr.message);
        clearErrorAfterDelay();
        return false;
      }
    }

    // Sync local React state
    setCurrentUser(prev => ({
      ...prev,
      ...profileUpdates,
      ...(updatedFields.email ? { email: updatedFields.email } : {})
    }));

    return true;
  };

  const value = {
    currentUser,
    loading,
    authError,
    login,
    register,
    logout,
    updateProfile
    // resetDemoData removed — not applicable with real DB
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
