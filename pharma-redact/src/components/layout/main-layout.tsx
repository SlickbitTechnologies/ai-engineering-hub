"use client";

import { FC, useState, useEffect } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "../auth/ProtectedRoute";
import Image from "next/image";
import { classNames } from "@/utils/classNames";
import { cn } from "@/utils/cn";
import { RulesIcon } from "@/components/icons/RulesIcon";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams?.get('status');
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when escape key is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside 
            className={`fixed inset-y-0 left-0 transform top-16 w-64 bg-white shadow-lg border-r z-30 transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Main Navigation */}
            <nav className="px-4 py-6 flex-1 overflow-y-auto">
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      pathname === "/" 
                        ? "bg-primary-50 text-primary-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="/documents"
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      pathname === "/documents" 
                        ? "bg-primary-50 text-primary-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documents
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="/redact"
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      pathname === "/redact" 
                        ? "bg-primary-50 text-primary-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Redact Document
                  </Link>
                </li>
                
                <li>
                  <Link
                    href="/redaction-rules"
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      pathname === "/redaction-rules" 
                        ? "bg-primary-50 text-primary-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <RulesIcon className="h-5 w-5" />
                    Redaction Settings
                  </Link>
                </li>
              </ul>
            </nav>

            {/* User profile section */}
            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={user.name} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 font-medium text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </aside>

          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden" 
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* Main content */}
          <main className="flex-1 md:pl-64">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}; 