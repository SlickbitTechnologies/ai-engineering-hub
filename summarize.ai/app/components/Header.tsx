'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { 
  LogOut,
  User,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { signOutUser } from '@/app/firebase/auth';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  
  // Get authentication state from Redux store
  const { isAuthenticated, displayName } = useSelector((state: any) => state.user);
  
  useEffect(() => {
    // Load theme from localStorage on component mount
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <header 
      role="banner"
      className="fixed top-0 left-0 w-full h-16 bg-card/80 backdrop-blur-xl border-b border-border/40 shadow-md z-50 flex items-center justify-between px-4"
    >
      {/* Left Section - Logo */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden mr-3 p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <Link href="/" className="flex items-center group relative">
          <h1 className="text-xl font-bold transition-opacity duration-300 overflow-hidden">
            <span className="text-green-600 text-2xl">Summarize</span>
            <span className="text-foreground text-2xl">.AI</span>
            <motion.svg 
              width="100%" 
              height="8" 
              viewBox="0 0 100 8"
              className="absolute right-0 w-full h-2 text-green-500 dark:text-green-400"
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
        </Link>
      </div>
      
      {/* Right Section - Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        
        {/* User Menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:ring-2 hover:ring-green-500/50 transition-all"
              aria-label="Open user menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <span className="text-sm font-medium">
                {displayName?.substring(0, 2) || 'US'}
              </span>
            </button>
            
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-md shadow-lg border border-border/40 z-50">
                <div className="px-4 py-2 border-b border-border/40">
                  <p className="text-sm font-medium truncate">{displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await signOutUser();
                      toast.success("You've been logged out.");
                      router.push('/auth');
                      setUserMenuOpen(false);
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-muted/70 text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            href="/auth"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/15 transition-all"
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Login</span>
          </Link>
        )}
      </div>
    </header>
  );
} 