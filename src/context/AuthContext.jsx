import React, { createContext, useContext, useState, useEffect } from 'react';
import { readStorage, writeStorage, KEYS, initializeDB } from '../utils/localStorage';
import { comparePassword, hashPassword } from '../utils/crypto';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize DB and load current user from storage on mount
  useEffect(() => {
    initializeDB();
    const storedUser = readStorage(KEYS.CURRENT_USER);
    if (storedUser) {
      // Re-validate that user still exists and is active in DB
      const users = readStorage(KEYS.USERS) || [];
      const dbUser = users.find(u => u.id === storedUser.id);
      if (dbUser && dbUser.status === 'active') {
        setCurrentUser(dbUser);
      } else {
        // If user was deleted or blocked, log them out
        writeStorage(KEYS.CURRENT_USER, null);
        setCurrentUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Clear errors after 4 seconds
  const clearErrorAfterDelay = () => {
    setTimeout(() => {
      setAuthError(null);
    }, 4000);
  };

  /**
   * Log a user in.
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    setAuthError(null);
    
    // Read current users from store
    const users = readStorage(KEYS.USERS) || [];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setAuthError("We couldn't find an account with that email.");
      clearErrorAfterDelay();
      return false;
    }

    if (user.status === 'locked' || user.status === 'suspended') {
      setAuthError(`This account has been ${user.status}. Please contact support for help.`);
      clearErrorAfterDelay();
      return false;
    }

    // Compare passwords
    const isValid = comparePassword(password, user.passwordHash);
    if (!isValid) {
      setAuthError("Incorrect password. Try again.");
      clearErrorAfterDelay();
      return false;
    }

    // Set active session
    // Strip sensitive hash info from state for cleanliness
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };

    writeStorage(KEYS.CURRENT_USER, sessionUser);
    setCurrentUser(user); // Keep full details in react state
    return true;
  };

  /**
   * Register a new user (only Buyer or Seller role).
   */
  const register = async (name, email, password, role) => {
    setAuthError(null);

    if (role !== 'Buyer' && role !== 'Seller') {
      setAuthError("Invalid registration role. Only buyers and sellers may register.");
      clearErrorAfterDelay();
      return false;
    }

    const users = readStorage(KEYS.USERS) || [];
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      setAuthError("This email is already registered. Try logging in.");
      clearErrorAfterDelay();
      return false;
    }

    const newUser = {
      id: `user-${role.toLowerCase()}-${Date.now()}`,
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeStorage(KEYS.USERS, users);

    // Auto-login after registration
    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt
    };
    writeStorage(KEYS.CURRENT_USER, sessionUser);
    setCurrentUser(newUser);
    return true;
  };

  /**
   * Log the current user out.
   */
  const logout = () => {
    writeStorage(KEYS.CURRENT_USER, null);
    setCurrentUser(null);
    setAuthError(null);
  };

  /**
   * Update current user's profile details.
   */
  const updateProfile = (updatedFields) => {
    if (!currentUser) return false;

    const users = readStorage(KEYS.USERS) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) return false;

    const updatedUser = {
      ...users[userIndex],
      ...updatedFields
    };

    // If updating password
    if (updatedFields.password) {
      updatedUser.passwordHash = hashPassword(updatedFields.password);
      delete updatedUser.password;
    }

    users[userIndex] = updatedUser;
    writeStorage(KEYS.USERS, users);

    // Sync session state
    const sessionUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt
    };
    writeStorage(KEYS.CURRENT_USER, sessionUser);
    setCurrentUser(updatedUser);
    return true;
  };

  /**
   * Resets local storage back to initial seeded database state.
   */
  const resetDemoData = () => {
    initializeDB(true);
    setCurrentUser(null);
    window.location.reload();
  };

  const value = {
    currentUser,
    loading,
    authError,
    login,
    register,
    logout,
    updateProfile,
    resetDemoData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
