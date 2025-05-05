'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes from unauthenticated access
 * Redirects to auth page with a toast message if user is not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only check after the initial loading is complete
    if (!isLoading && !user) {
      // Show toast notification
      toast.error('Please log in to access this feature.', {
        id: 'auth-required', // Prevent duplicate toasts
        duration: 4000,
      });
      
      // Redirect to auth page
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Show nothing while loading or redirecting
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/30"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
} 