'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  FileTerminal,
  UploadCloud,
  ChevronRight, 
  Menu, 
  X,
  Settings,
  User,
  LogOut,
  Home,
  FileType
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function SideNav() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Only used for mobile
  const pathname = usePathname();
  const router = useRouter();

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsOpen(false);
      } else {
        setIsMobile(false);
        setIsOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Don't render for non-authenticated users or specific pages
  if (!isAuthenticated || pathname === '/' || pathname.startsWith('/auth')) {
    return null;
  }

  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/documents', icon: <FileText size={20} />, label: 'Documents' },
    { path: '/documents/upload', icon: <UploadCloud size={20} />, label: 'Upload Document' },
    { path: '/templates', icon: <Settings size={20} />, label: 'Redaction Settings' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Toggle button for mobile */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-30 bg-white p-2 rounded-md shadow-md text-chateau-green-600"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div 
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-20 shadow-sm w-64 ${isMobile && !isOpen ? 'hidden' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto pt-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <motion.li key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href={item.path} className="block">
                    <div 
                      className={`flex items-center px-3 py-3 rounded-md ${
                        pathname === item.path || (pathname.startsWith(`${item.path}/`) && item.path !== '/documents/upload' && item.path !== '/redact')
                          ? 'bg-chateau-green-50 text-chateau-green-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="ml-3 font-medium text-sm">{item.label}</span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* User Profile and Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-chateau-green-600 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-10 w-10 rounded-full" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
            
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:text-chateau-green-600 hover:bg-gray-100 rounded-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
} 