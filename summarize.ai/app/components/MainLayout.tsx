'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  
  // Simplify parallax transforms with optimized ranges
  const topRightScale = useTransform(scrollY, [0, 1500], [1, 1.3]);
  const topRightY = useTransform(scrollY, [0, 1500], [0, -30]);
  
  const bottomLeftScale = useTransform(scrollY, [0, 1500], [1, 1.4]);
  const bottomLeftY = useTransform(scrollY, [0, 1500], [0, 40]);
  
  const centerScale = useTransform(scrollY, [0, 1500], [1, 1.2]);
  
  // Content transforms - subtle movement looks better
  const contentY = useTransform(scrollY, [0, 500], [0, 8]);
  
  // Prevent hydration issues with animations
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Visible dot pattern overlay - higher z-index to ensure visibility */}
      <div 
        className="fixed inset-0 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--dot-color) 1.5px, transparent 1.5px)`,
          backgroundSize: '10px 10px',
          backgroundAttachment: 'fixed',
          zIndex: 5,
        }}
      />
      
      {/* Decorative background elements with optimized parallax */}
      {mounted && (
        <>
          {/* Top-right decorative gradient */}
          <motion.div 
            className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full opacity-50 blur-3xl -z-10 will-change-transform" 
            style={{
              scale: topRightScale,
              y: topRightY
            }}
          />
          
          {/* Bottom-left decorative gradient */}
          <motion.div 
            className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-green-300/5 dark:bg-green-400/10 rounded-full opacity-50 blur-3xl -z-10 will-change-transform" 
            style={{
              scale: bottomLeftScale,
              y: bottomLeftY
            }}
          />
          
          {/* Center decorative element */}
          <motion.div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-background via-background to-transparent opacity-60 -z-10 will-change-transform" 
            style={{
              scale: centerScale
            }}
          />
        </>
      )}
      
      <div className="flex">
        {/* Sidebar - fixed on the left */}
        <div className="fixed top-0 left-0 z-40 h-screen">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <AnimatePresence mode="wait">
          {mounted && (
            <motion.main 
              className="flex-1 ml-[280px] min-h-screen overflow-x-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ 
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1] 
              }}
            >
              <motion.div 
                className="max-w-6xl mx-auto p-6 md:p-10 lg:p-12 relative z-10"
                style={{ y: contentY }}
              >
                {children}
              </motion.div>
              
              {/* Footer with simpler animation */}
              <motion.footer 
                className="py-8 px-6 mt-16 text-center text-sm text-muted-foreground border-t border-border/30 relative z-10"
              >
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="opacity-75">
                    © {new Date().getFullYear()} Summarize.AI. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6">
                    <motion.a 
                      href="#" 
                      className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors opacity-75"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      Privacy
                    </motion.a>
                    <motion.a 
                      href="#" 
                      className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors opacity-75"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      Terms
                    </motion.a>
                    <motion.a 
                      href="#" 
                      className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors opacity-75"
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      Contact
                    </motion.a>
                  </div>
                </div>
              </motion.footer>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 