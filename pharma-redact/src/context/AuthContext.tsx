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
      avatar: firebaseUser.photoURL
    };
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        const formattedUser = formatUser(firebaseUser);
        setUser(formattedUser);
        localStorage.setItem("user", JSON.stringify(formattedUser));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const formattedUser = formatUser(userCredential.user);
      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));
      router.push("/documents");
    } catch (error) {
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
      const result = await signInWithPopup(auth, googleProvider);
      const formattedUser = formatUser(result.user);
      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));
      router.push("/documents");
    } catch (error) {
      console.error("Google login failed:", error);
      throw new Error("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
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
}; 