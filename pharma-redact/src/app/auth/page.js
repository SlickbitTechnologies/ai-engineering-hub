'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, AlertCircle, User, Key, LogIn, UserPlus, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, registerUser } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

// Custom Google Icon component
const GoogleIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-5 w-5 mr-2"
  >
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path 
        fill="#4285F4" 
        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" 
      />
      <path 
        fill="#34A853" 
        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" 
      />
      <path 
        fill="#FBBC05" 
        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" 
      />
      <path 
        fill="#EA4335" 
        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" 
      />
    </g>
  </svg>
);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const pageTransition = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5,
      ease: "easeInOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    } 
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { 
      duration: 0.3,
      ease: "easeInOut" 
    } 
  }
};

const itemTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }
};

// Feature item component
const FeatureItem = ({ icon, text }) => (
  <motion.div 
    className="flex items-center space-x-3 mb-6"
    variants={itemTransition}
  >
    <div className="bg-chateau-green-100/30 p-2 rounded-full">
      {icon}
    </div>
    <div className="text-white font-medium">{text}</div>
  </motion.div>
);

// Login Illustration Component with animation
const LoginIllustration = () => (
  <motion.div
    className="relative" 
    variants={itemTransition}
  >
    <motion.div 
      className="w-64 h-64 bg-chateau-green-50/30 rounded-full flex items-center justify-center"
      variants={floatingAnimation}
      animate="animate"
      initial="initial"
    >
      <div className="w-48 h-48 bg-chateau-green-100/40 rounded-full flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: [0, 5, 0, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <LogIn className="h-20 w-20 text-white" />
        </motion.div>
      </div>
    </motion.div>
    
    {/* Floating elements */}
    <motion.div 
      className="absolute top-6 right-8"
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, 10, 0]
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.5
      }}
    >
      <CheckCircle className="h-8 w-8 text-chateau-green-100" />
    </motion.div>
    
    <motion.div 
      className="absolute bottom-10 left-5"
      animate={{ 
        y: [0, 12, 0],
        x: [0, -5, 0],
        rotate: [0, -10, 0]
      }}
      transition={{ 
        duration: 3.5, 
        repeat: Infinity,
        repeatType: "reverse",
        delay: 1
      }}
    >
      <FileText className="h-10 w-10 text-white/60" />
    </motion.div>
  </motion.div>
);

// Register Illustration Component with animation
const RegisterIllustration = () => (
  <motion.div
    className="relative" 
    variants={itemTransition}
  >
    <motion.div 
      className="w-64 h-64 bg-chateau-green-50/30 rounded-full flex items-center justify-center"
      variants={floatingAnimation}
      animate="animate"
      initial="initial"
    >
      <div className="w-48 h-48 bg-chateau-green-100/40 rounded-full flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: [0, -5, 0, 5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <UserPlus className="h-20 w-20 text-white" />
        </motion.div>
      </div>
    </motion.div>

    {/* Floating elements */}
    <motion.div 
      className="absolute top-12 left-0"
      animate={{ 
        y: [0, -8, 0],
        x: [0, 5, 0],
        rotate: [0, 15, 0]
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      <Shield className="h-12 w-12 text-white/60" />
    </motion.div>
    
    <motion.div 
      className="absolute bottom-5 right-0"
      animate={{ 
        y: [0, 10, 0],
        rotate: [0, -8, 0, 8, 0]
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity,
        repeatType: "reverse",
        delay: 0.7
      }}
    >
      <RefreshCw className="h-8 w-8 text-chateau-green-100" />
    </motion.div>
  </motion.div>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { googleSignIn } = useAuth();

  const toggleForm = () => {
    setError('');
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        // Validation for registration
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await registerUser(email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      console.error(isLogin ? 'Login error:' : 'Registration error:', err);
      setError(isLogin ? 
        'Failed to login. Please check your email and password.' : 
        'Failed to register. This email may already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await googleSignIn();
      router.push('/dashboard');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Marketing & Illustration */}
      <div className="w-full md:w-1/2 bg-chateau-green-600 flex flex-col overflow-hidden">
        <div className="p-6 md:p-10 h-full flex flex-col">
          {/* Logo and name */}
          <div className="flex items-center">
            <Shield className="h-10 w-10 text-white" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-white">PharmaRedact</div>
              <div className="text-sm text-chateau-green-50">Document Redaction Solution</div>
            </div>
          </div>

          {/* Marketing content */}
          <motion.div 
            className="mt-16 max-w-md"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-6"
              variants={itemTransition}
            >
              Secure. Compliant. Efficient.
            </motion.h2>
            <motion.p 
              className="text-chateau-green-50 text-lg mb-10"
              variants={itemTransition}
            >
              Protect sensitive information in your pharmaceutical documents with enterprise-grade redaction technology.
            </motion.p>

            <FeatureItem 
              icon={<Shield className="h-5 w-5 text-white" />} 
              text="HIPAA & GDPR Compliant" 
            />
            <FeatureItem 
              icon={<User className="h-5 w-5 text-white" />} 
              text="PII & PHI Protection" 
            />
            <FeatureItem 
              icon={<RefreshCw className="h-5 w-5 text-white" />} 
              text="AI-Powered Workflow" 
            />
          </motion.div>

          {/* Document illustration */}
          <div className="flex justify-center items-center h-80">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-illustration"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={pageTransition}
                  className="flex flex-col items-center"
                >
                  <LoginIllustration />
                </motion.div>
              ) : (
                <motion.div
                  key="register-illustration"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={pageTransition}
                  className="flex flex-col items-center"
                >
                  <RegisterIllustration />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right side - Authentication Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 md:p-10 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-form"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageTransition}
                className="space-y-6"
              >
                <motion.div variants={itemTransition}>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Sign in to your account
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Welcome back! Please enter your details below.
                  </p>
                </motion.div>


                {error && (
                  <motion.div 
                    className="rounded-md bg-red-50 p-4"
                    variants={itemTransition}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.form 
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={itemTransition}
                >
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="text-sm">
                        <a href="#" className="font-medium text-chateau-green-600 hover:text-chateau-green-500">
                          Forgot password?
                        </a>
                      </div>
                    </div>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-chateau-green-600 focus:ring-chateau-green-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </motion.button>
                </motion.form>

                <motion.div 
                  className="relative my-6"
                  variants={itemTransition}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  variants={itemTransition}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GoogleIcon />
                  Continue with Google
                </motion.button>

                <motion.p 
                  className="mt-6 text-center text-sm text-gray-600"
                  variants={itemTransition}
                >
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={toggleForm}
                    className="font-medium text-chateau-green-600 hover:text-chateau-green-500 focus:outline-none focus:underline transition-colors"
                  >
                    Sign up
                  </button>
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageTransition}
                className="space-y-6"
              >
                <motion.div variants={itemTransition}>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Create a new account
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Join us to securely redact sensitive information from your documents.
                  </p>
                </motion.div>

                {error && (
                  <motion.div 
                    className="rounded-md bg-red-50 p-4"
                    variants={itemTransition}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.form 
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  variants={itemTransition}
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full name
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="register-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                      Confirm password
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-chateau-green-500 focus:ring-chateau-green-500 sm:text-sm py-2 px-3"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-chateau-green-600 hover:bg-chateau-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </motion.button>
                </motion.form>

                <motion.div 
                  className="relative my-6"
                  variants={itemTransition}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-chateau-green-500"
                  variants={itemTransition}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GoogleIcon />
                  Continue with Google
                </motion.button>

                <motion.p 
                  className="mt-6 text-center text-sm text-gray-600"
                  variants={itemTransition}
                >
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={toggleForm}
                    className="font-medium text-chateau-green-600 hover:text-chateau-green-500 focus:outline-none focus:underline transition-colors"
                  >
                    Sign in
                  </button>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 