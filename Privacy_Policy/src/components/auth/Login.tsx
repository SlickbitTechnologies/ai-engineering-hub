import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { theme } from '../../styles/theme';

export default function Login() {
  const { signInWithGoogle, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    } finally {
      setLoading(false);
    }
  }

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen p-4"
      style={{ backgroundColor: theme.colors.background.secondary }}
    >
      <div 
        className="w-full max-w-md p-8 space-y-8 rounded-lg shadow-lg"
        style={{ backgroundColor: theme.colors.background.primary }}
      >
        <div className="flex flex-col items-center justify-center">
          <Logo size="xl" />
          <p 
            className="mt-4 text-center"
            style={{ color: theme.colors.neutral[600] }}
          >
            Simplify your privacy policy compliance
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div
            className="text-center py-4"
            style={{ color: theme.colors.neutral[700] }}
          >
            Sign in to continue
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-sm font-medium rounded-md shadow-sm transition-colors"
            style={{ 
              backgroundColor: theme.colors.background.primary,
              border: `1px solid ${theme.colors.neutral[200]}`,
              color: theme.colors.neutral[800] 
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
        
        <div 
          className="mt-6 text-center text-xs"
          style={{ color: theme.colors.neutral[500] }}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
} 