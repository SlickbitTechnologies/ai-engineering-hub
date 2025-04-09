'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only run this effect on the client side
  useEffect(() => {
    setIsMounted(true);
    
    // Check if user preference is already stored
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme based on stored preference or system preference
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isMounted) return null;

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-12 h-6 flex items-center rounded-full p-1 shadow-sm border border-green-200 dark:border-green-800 overflow-hidden"
      initial={false}
      animate={{ 
        backgroundColor: isDarkMode ? 'rgb(20, 83, 45)' : 'rgb(240, 253, 244)'
      }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 0 8px rgba(124, 170, 56, 0.5)" 
      }}
      transition={{ duration: 0.2 }}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track icons */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-between px-1.5 pointer-events-none">
        <Sun 
          className="w-3 h-3 text-amber-500 transition-opacity duration-200"
          style={{ opacity: isDarkMode ? 0 : 0.7 }}
        />
        <Moon 
          className="w-3 h-3 text-green-300 transition-opacity duration-200" 
          style={{ opacity: isDarkMode ? 0.7 : 0 }}
        />
      </div>
      
      {/* Toggle switch knob */}
      <motion.div
        className="absolute w-4 h-4 rounded-full shadow-sm flex items-center justify-center bg-white dark:bg-green-700"
        layout
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
        style={{
          left: isDarkMode ? "calc(100% - 1rem - 0.25rem)" : "0.25rem",
        }}
      >
        {isDarkMode ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-2.5 h-2.5 text-green-100" strokeWidth={2.5} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-2.5 h-2.5 text-amber-500" strokeWidth={2.5} />
          </motion.div>
        )}
      </motion.div>
    </motion.button>
  );
} 