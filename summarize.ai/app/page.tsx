'use client';

import Link from 'next/link';
import { ArrowRight, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import MainLayout from '@/app/components/MainLayout';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/Card';
import Hero from '@/app/components/Hero';
import Features from '@/app/components/Features';
import HowItWorks from '@/app/components/HowItWorks';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Home() {
  const { scrollY } = useScroll();
  
  // Simplified parallax transforms - just a few essential ones
  const benefitsY = useTransform(scrollY, [1400, 2000], [0, -30]);
  
  // One background blob transform for benefits section
  const benefitsBgY = useTransform(scrollY, [1400, 2000], [0, -40]);
  
  // CTA section transforms - subtle scale only
  const ctaScale = useTransform(scrollY, [1800, 2400], [0.98, 1.01]);
  
  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce hours of reading to minutes with AI-powered summaries'
    },
    {
      icon: Sparkles,
      title: 'Extract Key Points',
      description: 'Focus on what matters with accurate, concise summaries'
    },
    {
      icon: CheckCircle2,
      title: 'Improve Comprehension',
      description: 'Understand complex content with clear, structured summaries'
    }
  ];

  return (
    <MainLayout>
      <div className="content-layer flex flex-col gap-32 relative z-10">
        <div className="content-layer">
          <Hero />
        </div>
        
        <div className="content-layer relative overflow-visible">
          <HowItWorks />
        </div>
        
        <div className="content-layer relative overflow-visible">
          <Features />
        </div>
        
        {/* Benefits Section with Simplified Parallax */}
        <motion.section 
          className="container max-w-6xl mx-auto px-4 content-layer py-16 relative overflow-visible will-change-transform"
          style={{ y: benefitsY }}
        >
          {/* Single decorative background element */}
          <motion.div 
            className="absolute -top-20 right-10 w-96 h-96 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl -z-10 will-change-transform"
            style={{ y: benefitsBgY }}
          />
          
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose Summarize.AI</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered tools help you be more productive and efficient
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.2) }}
              >
                <Card className="p-6 dark:border-[#5F8729]/50 dark:bg-[#283618]/90 h-full">
                  <div className="flex flex-col gap-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70 flex items-center justify-center"
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0px 5px 15px rgba(124, 170, 56, 0.3)"
                      }}
                    >
                      <benefit.icon className="w-6 h-6 text-[#7CAA38] dark:text-[#9AC556]" />
                    </motion.div>
                    <CardTitle className="text-xl dark:text-[#D4E8AE]">{benefit.title}</CardTitle>
                    <CardDescription className="dark:text-[#B6D87E]/90">{benefit.description}</CardDescription>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* CTA Section with Simplified Parallax */}
        <motion.section 
          className="container max-w-6xl mx-auto px-4 pb-24 content-layer relative will-change-transform"
          style={{ scale: ctaScale }}
        >
          <Card spotlight={true} className="p-8 md:p-12 text-center dark:border-[#5F8729]/50 dark:bg-[#283618]/90 relative overflow-hidden">
            {/* One simple decorative glow effect */}
            <motion.div 
              className="absolute -bottom-20 -right-20 w-64 h-64 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-3xl md:text-4xl mb-4 dark:text-[#D4E8AE]">Ready to boost your productivity?</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto dark:text-[#B6D87E]/90">
                Join thousands of professionals who use Summarize.AI to extract valuable insights and save hours of reading time.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white" asChild>
                  <Link href="#features" scroll={false} onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Get Started For Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="dark:bg-[#3D5321] dark:border-[#5F8729]/80 dark:text-[#D4E8AE] dark:hover:bg-[#4A6823]"
                  asChild
                >
                  <Link href="#features" scroll={false} onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Learn More
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </MainLayout>
  );
} 