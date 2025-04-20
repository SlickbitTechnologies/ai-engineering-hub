'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, getCurrentUser, logoutUser, signInWithGoogle } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create the authentication context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[app/lib/AuthContext]: Setting up auth state listener');
    
    // Subscribe to the Firebase auth state change events
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log('[app/lib/AuthContext]: Auth state changed', authUser ? `User: ${authUser.uid}` : 'No user');
      setUser(authUser);
      setLoading(false);
    }, (error) => {
      console.error('[app/lib/AuthContext]: Auth state change error', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  
  const googleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Value provided to consuming components
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    getCurrentUser,
    signOut,
    googleSignIn
  };

  // Always render children, don't wait for authentication
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 