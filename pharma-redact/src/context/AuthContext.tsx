"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/utils/firebase';

interface User {
  name: string;
  email: string;
  avatar?: string | null;
  uid: string;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Convert Firebase user to app user
  const formatUser = (firebaseUser: FirebaseUser): User => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || 'anonymous@example.com',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
      avatar: firebaseUser.photoURL,
      getIdToken: async () => {
        try {
          // Force refresh to get a new token
          const token = await firebaseUser.getIdToken(true);
          console.log('Got fresh ID token, length:', token.length);
          return token;
        } catch (err) {
          console.error('Error getting ID token:', err);
          throw err;
        }
      }
    };
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        console.log('User authenticated, UID:', firebaseUser.uid);
        const formattedUser = formatUser(firebaseUser);
        setUser(formattedUser);
        
        // Get a token right away to ensure it's ready
        firebaseUser.getIdToken(true)
          .then(token => console.log('Initial ID token obtained, length:', token.length))
          .catch(err => console.error('Failed to get initial token:', err));
      } else {
        console.log('No user authenticated');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token periodically to keep it fresh
  useEffect(() => {
    if (!user) return;
    
    const refreshInterval = setInterval(() => {
      user.getIdToken()
        .then(() => console.log('Token refreshed successfully'))
        .catch(err => console.error('Token refresh failed:', err));
    }, 30 * 60 * 1000); // Refresh every 30 minutes
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email sign-in successful, user:', userCredential.user.email);
      const formattedUser = formatUser(userCredential.user);
      setUser(formattedUser);
      
      // Store the user ID in localStorage for development mode access
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('firebase-user-id', userCredential.user.uid);
      }
      
      router.push("/documents");
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // The googleProvider has been configured with { prompt: 'select_account' }
      // This will force the account chooser to appear, even if the user is already signed in
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('Google sign-in successful, selected account:', result.user.email);
      const formattedUser = formatUser(result.user);
      setUser(formattedUser);
      
      // Store the user ID in localStorage for development mode access
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('firebase-user-id', result.user.uid);
      }
      
      router.push("/documents");
    } catch (error: any) {
      console.error("Google login failed:", error);
      // Check for popup closed by user error (which isn't really an error)
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup was closed by the user");
      } else {
        throw new Error("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 