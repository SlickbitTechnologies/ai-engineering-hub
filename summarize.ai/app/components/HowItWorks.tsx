'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, FileText, Sparkles, Search } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const steps = [
  {
    title: "Upload Content",
    description: "Upload a PDF, paste text, enter a URL, or upload an audio file to begin.",
    icon: Search,
    iconBg: "bg-[#E9F3D4] dark:bg-[#3D5321]",
    iconColor: "text-[#7CAA38] dark:text-[#9AC556]"
  },
  {
    title: "AI Processing",
    description: "Our advanced AI analyzes the content, identifying key points and important details.",
    icon: Sparkles,
    iconBg: "bg-[#E9F3D4] dark:bg-[#3D5321]",
    iconColor: "text-[#7CAA38] dark:text-[#9AC556]"
  },
  {
    title: "Get Summary",
    description: "Receive a concise, well-structured summary that captures the essence of the original.",
    icon: FileText,
    iconBg: "bg-[#E9F3D4] dark:bg-[#3D5321]",
    iconColor: "text-[#7CAA38] dark:text-[#9AC556]"
  }
];

export default function HowItWorks() {
  const { scrollY } = useScroll();
  
  // Setting up intersection observer for entire section
  const [sectionRef, sectionInView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Simplified parallax effects
  const bgY = useTransform(scrollY, [300, 800], [0, 50]);
  const contentY = useTransform(scrollY, [400, 800], [0, -20]);
  const barScaleX = useTransform(scrollY, [400, 800], [0.9, 1.1]);
  
  // Individual step observers with progressive thresholds for sequential animation
  const stepObservers = steps.map((_, index) => {
    return useInView({
      threshold: 0.8 - (index * 0.2), // First step needs more visibility, last step triggers earlier
      triggerOnce: false,
      rootMargin: `-${10 + (index * 50)}px 0px -10px 0px` // Custom margins for each step
    });
  });
  
  // Observers for the arrows
  const arrowObservers = Array(steps.length - 1).fill(0).map((_, i) => useInView({
    threshold: 0.5,
    triggerOnce: false,
    rootMargin: "-30px"
  }));

  return (
    <section className="py-16 relative overflow-hidden" ref={sectionRef}>
      {/* Background decoration */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-green-500/5 dark:bg-green-500/10 rounded-full opacity-70 blur-3xl -z-10 will-change-transform" 
        style={{ y: bgY }}
      />
      
      <div className="container max-w-6xl mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform any content into concise summaries
          </p>
        </motion.div>
        
        {/* Steps with arrows between them */}
        <div className="md:flex md:items-center md:justify-center md:gap-2 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            // Each step has its own observer
            const [stepRef, stepInView] = stepObservers[index];
            
            return (
              <React.Fragment key={index}>
                <motion.div
                  ref={stepRef}
                  initial={{ opacity: 0, y: 50 }}
                  animate={stepInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ 
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex-1 flex flex-col items-center text-center"
                >
                  <div className="relative mb-5">
                    <motion.div 
                      className={`w-20 h-20 ${step.iconBg} rounded-full flex items-center justify-center shadow-md`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={stepInView ? 
                        { 
                          scale: 1, 
                          opacity: 1,
                          transition: { 
                            duration: 0.5,
                            delay: 0.1
                          }
                        } : 
                        { 
                          scale: 0.8, 
                          opacity: 0 
                        }
                      }
                    >
                      <step.icon className={`w-10 h-10 ${step.iconColor}`} />
                    </motion.div>
                    
                    {/* Floating animation - only starts after appearing */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      initial={{ y: 0 }}
                      animate={stepInView ? 
                        { y: [0, -5, 0] } : 
                        { y: 0 }
                      }
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 0.6 // Start floating after appearing
                      }}
                    />
                    
                    {/* Step number */}
                    <motion.div 
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#7CAA38] dark:bg-[#9AC556] text-white flex items-center justify-center font-bold shadow-sm"
                      initial={{ scale: 0 }}
                      animate={stepInView ? { scale: 1 } : { scale: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {index + 1}
                    </motion.div>
                  </div>
                  
                  <motion.h3 
                    className="text-xl font-semibold mb-3 dark:text-[#D4E8AE]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={stepInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {step.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-muted-foreground dark:text-[#B6D87E]/80"
                    initial={{ opacity: 0, y: 10 }}
                    animate={stepInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <motion.div 
                    ref={arrowObservers[index][0]}
                    className="hidden md:flex items-center justify-center w-12 h-12 my-4 md:my-0"
                    initial={{ opacity: 0 }}
                    animate={arrowObservers[index][1] ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ 
                        duration: 1.8, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight className="w-8 h-8 text-[#7CAA38] dark:text-[#9AC556]" />
                    </motion.div>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Mobile view steps (stacked with arrows between) */}
        <div className="flex flex-col items-center gap-2 md:hidden mt-6">
          {steps.map((step, index) => (
            index < steps.length - 1 && (
              <motion.div 
                key={`arrow-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + (index * 0.2) }}
                className="w-10 h-10 flex items-center justify-center my-1"
              >
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <ArrowRight className="w-6 h-6 text-[#7CAA38] dark:text-[#9AC556] rotate-90" />
                </motion.div>
              </motion.div>
            )
          ))}
        </div>
        
        {/* Highlight bar */}
        <motion.div 
          className="w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-[#7CAA38]/30 to-transparent mx-auto mt-16 will-change-transform"
          style={{ scaleX: barScaleX }}
          animate={sectionInView ? 
            { width: ["0%", "100%"], opacity: [0, 1] } : 
            { width: "100%", opacity: 0.5 }
          }
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </section>
  );
}
