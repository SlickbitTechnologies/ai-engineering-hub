'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
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

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
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
      {/* Main Navigation with Simplified Parallax */}
      <motion.div 
        className="flex-1 overflow-y-auto py-6 px-3 modern-scrollbar will-change-transform"
        style={{ y: navItemsY }}
      >
        <nav className="grid gap-2" aria-label="Main navigation">
          {routes.map((route) => (
            <motion.div key={route.href}>
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
                  <route.icon className={cn("w-[22px] h-[22px]")} />
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
      
      {/* Daily Quota Progress (above Slickbit logo) */}
      {isAuthenticated && (
        <div className="px-3 pt-2 pb-3 border-t border-border/30">
          <QuotaProgressBar isCollapsed={collapsed} />
        </div>
      )}
      
      {/* Slickbit logo at the bottom */}
      <div className="relative py-2 flex justify-center items-center overflow-hidden">
        <a 
          href="https://www.slickbit.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Visit Slickbit website"
          className="flex items-center justify-center relative z-10 transform transition-transform hover:scale-110 duration-300"
        >
          <img 
            src="/images/slickbitLogo.png" 
            alt="Slickbit – Product Owner" 
            className="h-10 w-18 object-contain invert"
            style={{ 
              filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.6))'
            }}
          />
        </a>
      </div>
    </motion.div>
  );
} 