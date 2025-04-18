'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Shield, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on public pages (home, auth) vs authenticated pages
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth');

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Common navbar for all authenticated pages
  if (isAuthenticated) {
    return (
      <motion.nav 
        className="bg-chateau-green-600 text-white sticky top-0 z-10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-white" />
                <div className="ml-3">
                  <div className="text-xl font-bold text-white">PharmaRedact</div>
                  <div className="text-xs text-chateau-green-100">Document Redaction Solution</div>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center">
              <motion.button
                className="p-2 rounded-full text-white hover:bg-chateau-green-700 focus:outline-none"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>
    );
  }

  // For public pages (login/register)
  return (
    <motion.nav 
      className="bg-chateau-green-600 text-white sticky top-0 z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/auth" className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-white" />
              <div className="ml-3">
                <div className="text-xl font-bold text-white">PharmaRedact</div>
                <div className="text-xs text-chateau-green-100">Document Redaction Solution</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link 
                href="/auth" 
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-white hover:bg-chateau-green-700"
              >
                Login
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth" className="bg-white text-chateau-green-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <motion.button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-chateau-green-700 focus:outline-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div 
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: mobileMenuOpen ? 1 : 0,
          height: mobileMenuOpen ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-chateau-green-700">
          <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-chateau-green-600">
            Login
          </Link>
          <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-chateau-green-600">
            Register
          </Link>
        </div>
      </motion.div>
    </motion.nav>
  );
} 