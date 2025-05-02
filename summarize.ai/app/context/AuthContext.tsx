'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenToAuthChanges, signOutUser } from '@/app/firebase/auth';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { fetchUserQuota } from '@/app/redux/features/quotaSlice';
import { AppDispatch } from '@/app/redux/store';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {}
});

// Context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Setup auth state listener
  useEffect(() => {
    // Set loading state
    setIsLoading(true);
    
    // Listen for auth state changes
    const unsubscribe = listenToAuthChanges((authUser) => {
      setUser(authUser);
      setIsLoading(false);
      
      // Fetch user quota when auth state changes to authenticated
      if (authUser) {
        dispatch(fetchUserQuota(authUser.uid));
        
        // Also try to fetch from the API for the most up-to-date quota
        fetch('/api/quota-status')
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Failed to fetch quota status');
          })
          .then(data => {
            if (data.quota) {
              // We'll let the Redux thunk handle this data
              console.log('Fetched initial quota status:', data.quota);
            }
          })
          .catch(error => {
            console.error('Error fetching initial quota:', error);
          });
      }
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [dispatch]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signOut: handleSignOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext); 