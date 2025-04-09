'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { ArrowRight, ArrowDownToLine, Zap, Brain, FileText, Languages } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function Hero() {
  const { scrollY } = useScroll();
  
  // Parallax transforms
  const rightBgY = useTransform(scrollY, [0, 300], [0, 100]);
  const rightBgOpacity = useTransform(scrollY, [0, 300], [0.5, 0]);
  
  const leftBgY = useTransform(scrollY, [0, 300], [0, 150]);
  const leftBgOpacity = useTransform(scrollY, [0, 300], [0.5, 0]);
  
  const contentY = useTransform(scrollY, [0, 300], [0, 50]);
  const contentOpacity = useTransform(scrollY, [0, 300], [1, 0.7]);
  
  const illustrationY = useTransform(scrollY, [0, 300], [0, 80]);
  const illustrationRotate = useTransform(scrollY, [0, 300], [0, 5]);

  const features = [
    {
      icon: <span className="text-xs px-2 py-1 border border-[#7CAA38]/30 bg-[#7CAA38]/10 dark:bg-[#7CAA38]/20 rounded-full text-[#7CAA38] dark:text-[#9AC556]">Instant</span>,
      text: "Quick summaries",
    },
    {
      icon: <span className="text-xs px-2 py-1 border border-[#7CAA38]/30 bg-[#7CAA38]/10 dark:bg-[#7CAA38]/20 rounded-full text-[#7CAA38] dark:text-[#9AC556]">Accurate</span>,
      text: "Precise information",
    },
    {
      icon: <span className="text-xs px-2 py-1 border border-[#7CAA38]/30 bg-[#7CAA38]/10 dark:bg-[#7CAA38]/20 rounded-full text-[#7CAA38] dark:text-[#9AC556]">Smart</span>,
      text: "AI-powered analysis",
    },
  ];

  return (
    <div className="relative w-full overflow-visible">
      {/* Background decorative elements with parallax */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl -z-1" 
        style={{ 
          y: rightBgY,
          opacity: rightBgOpacity
        }}
      />
      
      <motion.div 
        className="absolute bottom-10 left-10 w-72 h-72 bg-green-300/10 dark:bg-green-400/20 rounded-full blur-3xl -z-1" 
        style={{ 
          y: leftBgY,
          opacity: leftBgOpacity
        }}
      />
      
      <motion.div 
        className="container relative z-10 max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          y: contentY,
          opacity: contentOpacity
        }}
      >
        {/* Left content */}
        <motion.div className="flex flex-col space-y-4" variants={itemVariants}>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground mb-2 self-start">
            <span className="bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-xs mr-2">NEW</span>
            <span>AI-Powered Summarization</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-green-600 dark:text-green-400">Summarize</span> content 
            <span className="relative inline-block ml-2">
              instantly
              <motion.svg 
                width="100%" 
                height="8" 
                viewBox="0 0 100 8"
                className="absolute -bottom-1 left-0 w-full h-2 text-green-500 dark:text-green-400"
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
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mt-4">
            Extract key insights from any web page, PDF, or text in seconds. 
            Save time and focus on what matters most.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border/50 shadow-sm"
                variants={itemVariants}
                custom={i}
              >
                {feature.icon}
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="flex flex-row sm:flex-row gap-4 pt-4 mt-4"
            variants={itemVariants}
          >
            <Button 
              size="lg" 
              className="group bg-green-600 hover:bg-green-700 text-white"
              asChild
            >
              <Link href="#features" scroll={false} onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Right illustration with parallax */}
        <motion.div 
          className="relative h-[400px] lg:h-[500px] flex items-center justify-center"
          variants={itemVariants}
          style={{
            y: illustrationY,
            rotate: illustrationRotate
          }}
        >
          <div className="relative w-full max-w-md">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-300/20 dark:from-green-500/30 dark:to-green-400/30 rounded-3xl transform rotate-2 scale-[0.98] blur-xl" />
            
            {/* Main container */}
            <motion.div
              className="relative z-10 overflow-hidden rounded-2xl bg-card shadow-xl border border-border/50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Illustration header */}
              <div className="p-4 bg-background/50 dark:bg-muted/20 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium">Summarize.AI</div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className="h-7 w-20 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Processing</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Document display */}
              <div className="flex p-5">
                {/* Document content */}
                <div className="flex-1 border-r border-border/30 pr-5">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="text-sm font-medium">Original Document</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-5 bg-muted/50 dark:bg-muted/30 rounded-md w-11/12" />
                    
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-1">
                          {[...Array(Math.floor(Math.random() * 2) + 2)].map((_, j) => (
                            <motion.div 
                              key={j} 
                              className="h-2.5 bg-muted/40 dark:bg-muted/20 rounded-md" 
                              style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: [0.5, 0.7, 0.5] }}
                              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    <div className="h-5 bg-muted/50 dark:bg-muted/30 rounded-md w-9/12 mt-6" />
                    
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-1">
                          {[...Array(Math.floor(Math.random() * 2) + 2)].map((_, j) => (
                            <motion.div 
                              key={j} 
                              className="h-2.5 bg-muted/40 dark:bg-muted/20 rounded-md" 
                              style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: [0.5, 0.7, 0.5] }}
                              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 + 0.5 }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Summary content */}
                <div className="flex-1 pl-5">
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <Zap className="w-4 h-4 text-green-700 dark:text-green-400" />
                    </div>
                    <div className="text-sm font-medium">AI Summary</div>
                  </div>
                  
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                  >
                    {/* Key points */}
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="font-medium text-sm mb-2 text-green-800 dark:text-green-300">Key Points</div>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start mb-2 last:mb-0">
                          <div className="text-green-600 dark:text-green-400 mr-2 mt-0.5">•</div>
                          <motion.div 
                            className="h-3 bg-green-200/80 dark:bg-green-700/50 rounded-md flex-1"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 2 + i * 0.5, duration: 0.8 }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Summary text */}
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <motion.div 
                          key={i}
                          className="h-3 bg-muted/60 dark:bg-muted/40 rounded-md" 
                          style={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                          transition={{ delay: 2.5 + i * 0.2, duration: 0.7 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Animation overlay */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ 
                      scale: [1, 4, 1],
                      opacity: [1, 0, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      times: [0, 0.5, 1],
                      repeat: 1,
                      repeatDelay: 0.5
                    }}
                  >
                    <Brain className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                </div>
              </div>
              
              {/* Actions footer */}
              <div className="p-4 bg-background/50 dark:bg-muted/10 border-t border-border/30">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <motion.div
                      className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center cursor-pointer"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.2)' }}
                    >
                      <FileText className="w-4 h-4 text-green-700 dark:text-green-400" />
                    </motion.div>
                    <motion.div
                      className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center cursor-pointer"
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.2)' }}
                    >
                      <Languages className="w-4 h-4 text-green-700 dark:text-green-400" />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    className="h-8 px-3 rounded-md bg-green-600 text-white flex items-center justify-center cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-xs font-medium mr-1">Download</span>
                    <ArrowDownToLine className="w-3 h-3" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 