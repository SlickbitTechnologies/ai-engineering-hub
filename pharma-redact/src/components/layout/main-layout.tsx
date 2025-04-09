"use client";

import { useState, useEffect } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "../auth/ProtectedRoute";
import Image from "next/image";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 ${
                      pathname === "/" 
                        ? "bg-chateau-green-50 text-chateau-green-600" 
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 ${
                      pathname.startsWith("/documents")
                        ? "bg-chateau-green-50 text-chateau-green-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Documents
                  </Link>
                </li>
                
                <li>
                  <Link 
                    href="/redaction-rules" 
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500 ${
                      pathname.startsWith("/redaction-rules") 
                        ? "bg-chateau-green-50 text-chateau-green-600" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Redaction Rules
                  </Link>
                </li>
              </ul>
            </nav>

            {/* User profile section */}
            {user && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full bg-chateau-green-100 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={user.name} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-chateau-green-600 font-medium text-lg">
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-chateau-green-500"
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
} 