'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, getCurrentUser } from './firebase';
import Cookies from 'js-cookie';

// Create a context with default values
const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  console.log('AuthProvider initializing (attempt: ' + initializationAttempts + ')');

  // This effect tries to get the current user if auth is already initialized
  useEffect(() => {
    // If auth is available and we already have a current user, set it
    if (auth) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log('AuthProvider: Found current user in auth:', currentUser.uid);
        setUser(currentUser);
        setLoading(false);
        Cookies.set('auth', 'true', { expires: 7 });
        return;
      }
    }
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener (attempt: ' + initializationAttempts + ')');
    
    let unsubscribed = false;
    
    // Ensure Firebase auth is initialized before setting up listener
    if (!auth) {
      console.error('Auth is not available. Firebase might not be initialized correctly.');
      setLoading(false);
      
      // Try again in 1 second if this is less than 3 attempts
      if (initializationAttempts < 3) {
        const timer = setTimeout(() => {
          setInitializationAttempts(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
      
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        
        if (!unsubscribed) {
          if (user) {
            setUser(user);
            // Set auth cookie when we get a user
            Cookies.set('auth', 'true', { expires: 7 });
          } else {
            setUser(null);
            // Remove auth cookie when user is null
            Cookies.remove('auth');
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state observer error:', error);
        if (!unsubscribed) {
          setLoading(false);
        }
      }
    );

    // Cleanup function to remove listener on unmount
    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribed = true;
      unsubscribe();
    };
  }, [initializationAttempts]);

  const signIn = async (email, password) => {
    console.log('Attempting to sign in with email:', email);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error.code, error.message);
      let errorMessage = 'Failed to sign in. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    console.log('Attempting to sign up with email:', email);
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.uid);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error.code, error.message);
      let errorMessage = 'Failed to create account. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Account creation is currently disabled. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Attempting to sign out');
    try {
      await firebaseSignOut(auth);
      console.log('Sign out successful');
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error.code, error.message);
      return { 
        success: false, 
        error: 'Failed to sign out. Please try again.' 
      };
    }
  };

  const resetPassword = async (email) => {
    console.log('Attempting to reset password for email:', email);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent');
      return { 
        success: true, 
        message: 'Password reset email sent. Check your inbox for further instructions.' 
      };
    } catch (error) {
      console.error('Password reset error:', error.code, error.message);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Debug values
  const contextValue = {
    user, 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    resetPassword,
    isAuthenticated: !!user
  };
  
  console.log('AuthContext state:', {
    isAuthenticated: !!user,
    loading,
    userExists: !!user,
    uid: user?.uid
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Add debug logging
  console.log('useAuth called, returning:', {
    user: !!context.user,
    loading: context.loading,
    isAuthenticated: context.isAuthenticated,
    uid: context.user?.uid
  });
  
  return context;
}; 