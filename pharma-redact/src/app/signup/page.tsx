"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update password strength if password field is changed
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let score = 0;
    // Length check
    if (password.length >= 8) score += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1;
    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1;
    // Contains number
    if (/[0-9]/.test(password)) score += 1;
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(score, 4);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-yellow-400";
    return "bg-green-500";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      setError("Please choose a stronger password");
      setIsLoading(false);
      return;
    }

    try {
      // In a real app, this would be an API call to register the user
      // For now, we'll just simulate a signup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to login page after successful signup
      router.push("/login");
    } catch (err) {
      setError("An error occurred during signup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      // Google login/signup automatically redirects to the dashboard
    } catch (err) {
      setError("An error occurred during Google signup. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-chateau-green-600 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">PharmaRedact</h1>
              <p className="text-white/80">Document Redaction Solution</p>
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Join the trusted solution for pharmaceutical document security</h2>
            <p className="text-xl mb-8">Create your account and start protecting sensitive information today.</p>
            
            <div className="space-y-4 text-white/90">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </div>
                <span>30-day free trial</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span>99.9% uptime SLA</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <span>24/7 technical support</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Illustration */}
        <div className="relative h-72 mt-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-56 h-56 text-white">
                <path fill="currentColor" fillOpacity="0.15" d="M45.7,-49.2C58.9,-34.7,69.2,-17.3,69.4,0.2C69.6,17.8,59.8,35.5,46.5,47.4C33.2,59.2,16.6,65.2,-0.4,65.6C-17.3,66,-34.7,60.7,-45.8,48.9C-56.9,37.1,-61.7,18.5,-62.1,-0.4C-62.5,-19.3,-58.4,-38.7,-47.2,-53.2C-36,-67.7,-18,-77.4,-0.2,-77.2C17.6,-77,35.2,-66.8,45.7,-49.2Z" transform="translate(100 100)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-24 w-24 text-white">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M8 11l3 3 5-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Signup form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="md:hidden mb-8 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-chateau-green-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">PharmaRedact</h1>
          <p className="text-gray-600">Document Redaction Solution</p>
        </div>
        
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
              <p className="text-gray-600 mt-1">Get started with your free trial</p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </button>
            </div>
            
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-200 absolute w-full"></div>
              <div className="bg-white px-4 text-sm text-gray-500 relative">or sign up with email</div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500"
                  placeholder="name@company.com"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company name
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500"
                />
                
                {/* Password strength meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex w-full max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getPasswordStrengthColor()}`} 
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{getPasswordStrengthLabel()}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use 8+ characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-chateau-green-500 focus:border-chateau-green-500 ${
                    formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 bg-chateau-green-600 hover:bg-chateau-green-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 focus:ring-offset-2 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-chateau-green-600 hover:text-chateau-green-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 