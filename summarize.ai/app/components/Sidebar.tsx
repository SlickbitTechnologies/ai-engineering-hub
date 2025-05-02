'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { 
  FileText, 
  Globe, 
  Headphones, 
  History, 
  Home, 
  Languages, 
  FileType, 
  Menu, 
  X,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Youtube
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';
import ThemeToggle from '@/app/components/ThemeToggle';
import { signOutUser } from '@/app/firebase/auth';
import { useSelector } from 'react-redux';
import QuotaProgressBar from '@/app/components/QuotaProgressBar';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const router = useRouter();
  
  // Get authentication state from Redux store
  const { isAuthenticated, displayName } = useSelector((state: any) => state.user);
  
  // Simplified parallax transforms - just one subtle movement
  const navItemsY = useTransform(scrollY, [0, 1000], [0, -10]);
  
  // Logo glow opacity animation - no transform
  const logoGlowOpacity = useTransform(scrollY, [0, 500], [0.4, 0.5], {
    clamp: true
  });
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const routes = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      color: 'text-green-500',
      active: pathname === '/'
    },
    {
      href: '/web-scrape',
      label: 'Web Summarizer',
      icon: Globe,
      color: 'text-green-600',
      active: pathname === '/web-scrape'
    },
    {
      href: '/youtube-summarize',
      label: 'YouTube Summarizer',
      icon: Youtube,
      color: 'text-green-500',
      active: pathname === '/youtube-summarize'
    },
    {
      href: '/pdf',
      label: 'PDF Summarizer',
      icon: FileText,
      color: 'text-green-700',
      active: pathname === '/pdf'
    },
    {
      href: '/audio',
      label: 'Audio Summarizer',
      icon: Headphones,
      color: 'text-green-500',
      active: pathname === '/audio-summarize'
    },
    {
      href: '/text',
      label: 'Text Summarizer',
      icon: FileType,
      color: 'text-green-600',
      active: pathname === '/text-summarize'
    },
    {
      href: '/translate',
      label: 'Translator',
      icon: Languages,
      color: 'text-green-700',
      active: pathname === '/translate'
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
      color: 'text-gray-500',
      active: pathname === '/history'
    },
  ];

  const bottomRoutes = [
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-500',
    },
    {
      href: '/help',
      label: 'Help',
      icon: HelpCircle,
      color: 'text-gray-500',
    },
  ];

  return (
    <motion.div 
      className={cn(
        "h-full flex flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl shadow-sm z-40",
        collapsed ? "w-[80px]" : "w-[280px]"
      )}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo & Toggle */}
      <div className="p-6 flex items-center justify-between border-b border-border/30">
        <Link href="/" className="flex items-center gap-3 group relative">     
          {!collapsed && (
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
          )}
          
          {/* Background glow effect - static position */}
          <div 
            className="absolute -z-10 w-60 h-60 rounded-full bg-green-600/30 dark:bg-green-500/30 pointer-events-none"
            style={{ 
              opacity: 0.4,
              left: '-15px',
              top: '-15px',
              filter: 'blur(40px)',
              transform: 'translateZ(0)',
              willChange: 'filter, opacity'
            }}
          />
        </Link>
        
        <motion.button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95 text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </motion.button>
      </div>
      
      {/* Show quota progress bar for authenticated users */}
      {isAuthenticated && !collapsed && (
        <QuotaProgressBar />
      )}
      
      {/* Main Navigation with Simplified Parallax */}
      <motion.div 
        className="flex-1 overflow-y-auto py-6 px-3 modern-scrollbar will-change-transform"
        style={{ y: navItemsY }}
      >
        <nav className="grid gap-2">
          {routes.map((route, index) => (
            <motion.div
              key={route.href}
            >
              <Link 
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1 rounded-xl text-muted-foreground",
                  "transition-all duration-300 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  route.active ? "bg-primary/5 text-foreground font-medium" : "",
                  "group relative"
                )}
              >
                <motion.div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl",
                    route.active ? "bg-background shadow-sm" : "bg-muted/30",
                    "transition-all duration-300 group-hover:shadow-sm"
                  )}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 2,
                  }}
                >
                  <route.icon className={cn("w-[22px] h-[22px]", )} />
                </motion.div>
                
                {!collapsed && (
                  <span className="truncate transition-transform">{route.label}</span>
                )}
                
                {route.active && !collapsed && (
                  <motion.div 
                    className="absolute right-3 w-1.5 h-5 rounded-full bg-primary"
                    initial={{ height: 0 }}
                    animate={{ height: 20 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>
      </motion.div>
      
      {/* Bottom Navigation - Static (no parallax) */}
      <div className="border-t border-border/30 px-3 py-4">
        <div className="grid gap-2">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2.5">
            {!collapsed && (
              <span className="text-muted-foreground">Theme</span>
            )}
            <ThemeToggle />
          </div>
          
          {/* Authentication */}
          {isAuthenticated ? (
            <>
              {/* User Profile Button */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground group">
                <motion.div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-sm"
                  whileHover={{ 
                    scale: 1.05,
                    rotate: 2,
                  }}
                >
                  <span className="text-sm font-medium">
                    {displayName?.substring(0, 2) || 'US'}
                  </span>
                </motion.div>
                
                {!collapsed && (
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Signed in
                    </p>
                  </div>
                )}
              </div>
              
              {/* Sign Out Button */}
              <button 
                onClick={async () => {
                  try {
                    await signOutUser();
                    toast.success("You've been logged out.");
                    router.push('/auth');
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground",
                  "transition-all duration-300 hover:bg-muted/70 hover:text-red-500",
                  "group"
                )}
              >
                <motion.div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-background/80 shadow-sm transition-all duration-300"
                  whileHover={{ 
                    scale: 1.05,
                    rotate: -2
                  }}
                >
                  <LogOut className="w-[18px] h-[18px] text-red-500" />
                </motion.div>
                
                {!collapsed && (
                  <span className="font-medium">Sign Out</span>
                )}
              </button>
            </>
          ) : (
            /* Login Button */
            <Link 
              href="/auth"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl",
                "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/15",
                "transition-all duration-300",
                "group"
              )}
            >
              <motion.div 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-background/80 shadow-sm transition-all duration-300"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0px 5px 15px rgba(124, 170, 56, 0.3)"
                }}
              >
                <User className="w-[18px] h-[18px] text-green-600 dark:text-green-400" />
              </motion.div>
              
              {!collapsed && (
                <span className="font-medium">Login</span>
              )}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
} 