'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/Card';
import { LoginIllustration, SignUpIllustration } from '@/app/components/ui/illustrations/AuthIllustrations';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, getCurrentUser } from '@/app/firebase/auth';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <motion.div 
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 flex items-start gap-3 ${
        type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <p className={`text-sm ${
        type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {message}
      </p>
      <button 
        onClick={onClose} 
        className="ml-auto text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default function AuthPage() {
  // Auth mode state (login or signup)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Signup form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  
  // Google auth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Password strength validation state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  const router = useRouter();

  // Check URL parameters for initial mode
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get('mode');
    
    if (modeParam === 'signup') {
      setAuthMode('signup');
    }

    // Check for auth_redirect cookie and show toast message
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue;
      }
      return null;
    };
    
    const redirectMessage = getCookie('auth_redirect');
    if (redirectMessage) {
      setToast({ message: redirectMessage, type: 'error' });
      // Remove the cookie
      document.cookie = 'auth_redirect=; path=/; max-age=0';
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push('/'); // Redirect to home page if already logged in
    }
  }, [router]);

  // Validate password strength for signup
  useEffect(() => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    setPasswordChecks(checks);
    
    // Calculate strength score (0-5)
    const score = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(score);
  }, [password]);

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setToast({ message: 'Please enter both email and password.', type: 'error' });
      return;
    }
    
    try {
      setIsLoginLoading(true);
      await signInWithEmail(loginEmail, loginPassword);
      setToast({ message: 'Login successful!', type: 'success' });
      setTimeout(() => {
        router.push('/'); // Redirect to home page after successful login
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to sign in. Please try again.', type: 'error' });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handle signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim() || !signupEmail.trim() || !password.trim() || !confirmPassword.trim()) {
      setToast({ message: 'Please fill in all fields.', type: 'error' });
      return;
    }
    
    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    
    if (passwordStrength < 3) {
      setToast({ message: 'Please use a stronger password.', type: 'error' });
      return;
    }
    
    try {
      setIsSignupLoading(true);
      await signUpWithEmail(signupEmail, password, name);
      setToast({ message: 'Account created successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/'); // Redirect to home page after successful signup
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to sign up. Please try again.', type: 'error' });
    } finally {
      setIsSignupLoading(false);
    }
  };

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      setToast({ message: 'Login successful!', type: 'success' });
      setTimeout(() => {
        router.push('/'); // Redirect to home page after successful login
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to authenticate with Google. Please try again.', type: 'error' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Toggle between login and signup modes
  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-background">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none dot-pattern" />
      <motion.div 
        className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full opacity-50 blur-3xl -z-10"
        animate={{ 
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      <motion.div 
        className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-green-300/5 dark:bg-green-400/10 rounded-full opacity-50 blur-3xl -z-10"
        animate={{ 
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {/* Authentication container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        {/* Left side: Illustration */}
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col items-center"
          layout
          transition={{ duration: 0.6, type: "spring" }}
        >
          <motion.div
            className="relative w-full h-96"
            layout
          >
            {/* Logo */}
            <motion.div 
              className="absolute top-0 left-0 right-0 flex justify-center z-10 mb-8"
              layout
            >
              <h1 className="text-3xl font-bold relative">
                <span className="text-green-600 text-4xl">Summarize</span>
                <span className="text-foreground text-4xl">.AI</span>
                <motion.svg 
                  width="100%" 
                  height="8" 
                  viewBox="0 0 100 8"
                  className="absolute w-full h-2 text-green-500 dark:text-green-400"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                >
                  <motion.path
                    d="M0,5 C30,2 70,8 100,3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </h1>
            </motion.div>
            
            {/* Illustrations with crossfade transition */}
            <div className="mt-20 relative w-full h-80 flex items-center justify-center">
              <AnimatePresence mode="sync">
                {authMode === 'login' ? (
                  <motion.div
                    key="login-illustration"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <LoginIllustration width={450} height={350} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-illustration"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <SignUpIllustration width={450} height={350} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Header text */}
            <motion.div 
              className="mt-8 text-center"
              layout
            >
              <AnimatePresence mode="wait">
                {authMode === 'login' ? (
                  <motion.div
                    key="login-text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Welcome Back!</h2>
                    <p className="text-muted-foreground max-w-md">
                      Login to access personalized summaries and manage your content.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Get Started</h2>
                    <p className="text-muted-foreground max-w-md">
                      Create an account to unlock all features of Summarize.AI.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Right side: Auth forms */}
        <motion.div 
          className="w-full lg:w-1/2 max-w-md"
          layout
          transition={{ duration: 0.6, type: "spring" }}
        >
          <Card className="backdrop-blur-sm bg-card/70 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Login Form */}
              {authMode === 'login' && (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <CardHeader className="space-y-2">
                    <h2 className="text-2xl font-bold text-center">Login</h2>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your credentials to sign in
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label 
                          htmlFor="login-email" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Email
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label 
                            htmlFor="login-password" 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Password
                          </label>
                        </div>
                        <input
                          id="login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-primary"
                        isLoading={isLoginLoading}
                      >
                        Sign In
                      </Button>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleAuth}
                      isLoading={isGoogleLoading}
                    >
                      <div className="flex items-center justify-center w-full">
                        {!isGoogleLoading && (
                          <svg className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        <span className={isGoogleLoading ? "" : "ml-1"}>Sign in with Google</span>
                      </div>
                    </Button>
                  </CardContent>
                  
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{' '}
                      <button 
                        onClick={toggleAuthMode} 
                        className="text-primary hover:text-primary/90 hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  </CardFooter>
                </motion.div>
              )}
              
              {/* Signup Form */}
              {authMode === 'signup' && (
                <motion.div
                  key="signup-form"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <CardHeader className="space-y-2">
                    <h2 className="text-2xl font-bold text-center">Create Account</h2>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your details to sign up
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <label 
                          htmlFor="name" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="Your Name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label 
                          htmlFor="signup-email" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Email
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label 
                          htmlFor="password" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="••••••••"
                          required
                        />
                        
                        {/* Password strength indicator */}
                        {password.length > 0 && (
                          <div className="mt-2 space-y-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  passwordStrength < 2 ? 'bg-red-500' : 
                                  passwordStrength < 4 ? 'bg-yellow-500' : 
                                  'bg-green-500'
                                }`} 
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              />
                            </div>
                            
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${passwordChecks.minLength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={passwordChecks.minLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                  At least 8 characters
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${passwordChecks.hasUppercase && passwordChecks.hasLowercase ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={passwordChecks.hasUppercase && passwordChecks.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                  Upper & lowercase letters
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${passwordChecks.hasNumber ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={passwordChecks.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                  At least one number
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${passwordChecks.hasSpecial ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={passwordChecks.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                  At least one special character
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label 
                          htmlFor="confirmPassword" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Confirm Password
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          placeholder="••••••••"
                          required
                        />
                        
                        {/* Password match indicator */}
                        {confirmPassword.length > 0 && (
                          <div className="flex items-center gap-2 mt-1.5">
                            {password === confirmPassword ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400">Passwords don&apos;t match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-primary"
                        isLoading={isSignupLoading}
                      >
                        Create Account
                      </Button>
                    </form>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleAuth}
                      isLoading={isGoogleLoading}
                    >
                      <div className="flex items-center justify-center w-full">
                        {!isGoogleLoading && (
                          <svg className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        <span className={isGoogleLoading ? "" : "ml-1"}>Sign up with Google</span>
                      </div>
                    </Button>
                  </CardContent>
                  
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <button 
                        onClick={toggleAuthMode} 
                        className="text-primary hover:text-primary/90 hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 