// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  registerUser, loginUser, signInWithGoogle, logoutUser, onAuthChange,
  getUserProfile, updateUserProfile, resetPassword,
} from '../services/firebase';
import useStore from '../store/useStore';

const AuthContext = createContext(null);

// Standard context pattern: useAuth + AuthProvider are meant to live together
// so every consumer imports from one place. Splitting into two files just for
// HMR purity isn't worth the churn here.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [authError,   setAuthError]   = useState(null);

  // ── Listen to Firebase auth state ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const prof = await getUserProfile(firebaseUser.uid);
          setProfile(prof);
        } catch (e) {
          console.error('Profile fetch error:', e);
        }
      } else {
        setUser(null);
        setProfile(null);
        useStore.getState().reset();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, displayName, profileData) => {
    setAuthError(null);
    try {
      const newUser = await registerUser(email, password, displayName, profileData);
      const prof = await getUserProfile(newUser.uid);
      setUser(newUser);
      setProfile(prof);
      return newUser;
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const cred = await loginUser(email, password);
      const prof = await getUserProfile(cred.user.uid);
      setUser(cred.user);
      setProfile(prof);
      return cred.user;
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  const googleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      const googleUser = await signInWithGoogle();
      const prof = await getUserProfile(googleUser.uid);
      setUser(googleUser);
      setProfile(prof);
      return googleUser;
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    // Clear cached transactions/savings/debts/cards so the next person to
    // log in on this device never sees a flash of the previous user's data.
    useStore.getState().reset();
  }, []);

  // ── Reset Password ───────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    try {
      await resetPassword(email);
    } catch (e) {
      throw new Error(friendlyAuthError(e.code));
    }
  }, []);

  // ── Update profile ────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setProfile(prev => ({ ...prev, ...data }));
  }, [user]);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      authError,
      isAuthenticated: !!user,
      register,
      login,
      googleSignIn,
      logout,
      forgotPassword,
      updateProfile,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Friendly error messages ───────────────────────────────────────────────
const friendlyAuthError = (code) => {
  const map = {
    'auth/email-already-in-use':    'Email is already registered. Try logging in.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/operation-not-allowed':   'Email/password sign-in is not enabled.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-disabled':           'This account has been disabled.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/too-many-requests':       'Too many attempts. Please wait a few minutes.',
    'auth/network-request-failed':  'Network error. Check your internet connection.',
    'auth/requires-recent-login':   'Please log out and log back in to continue.',
    'auth/popup-closed-by-user':     'Google sign-in was closed before it finished.',
    'auth/cancelled-popup-request':  'Another Google sign-in popup is already open.',
    'auth/popup-blocked':            'Your browser blocked the Google sign-in popup.',
    'auth/unauthorized-domain':      'This domain is not authorized for Google sign-in in Firebase.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email. Log in with your original sign-in method first.',
  };
  return map[code] || 'Something went wrong. Please try again.';
};
