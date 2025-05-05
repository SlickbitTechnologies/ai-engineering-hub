'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Globe, FileText, Headphones, Languages, FileType, History, Youtube } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/Card';
import Link from 'next/link';

const featuresData = [
  {
    title: 'Web Summarizer',
    description: 'Extract and summarize content from any web page with a single click.',
    icon: Globe,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/web-scrape',
  },
  {
    title: 'YouTube Summarizer',
    description: 'Get instant AI summaries, highlights and transcripts from YouTube videos.',
    icon: Youtube,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/youtube-summarize',
  },
  {
    title: 'PDF Summarizer',
    description: 'Upload PDF documents and get concise summaries of their content.',
    icon: FileText,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/pdf',
  },
  {
    title: 'Audio Summarizer',
    description: 'Convert audio files into text and generate summaries automatically.',
    icon: Headphones,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/audio',
  },
  {
    title: 'Text Summarizer',
    description: 'Paste any text and get an AI-powered summary in seconds.',
    icon: FileType,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/text',
  },
  {
    title: 'Translation',
    description: 'Translate and summarize content in multiple languages.',
    icon: Languages,
    iconColor: 'text-[#7CAA38]',
    bgColor: 'bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70',
    href: '/translate',
  },
];

export default function Features() {
  const { scrollY } = useScroll();
  
  // Simplified parallax effects - fewer transforms for better performance
  const featuresY = useTransform(scrollY, [800, 1300], [0, -20]);
  
  // Simplified background blob transforms
  const bgY = useTransform(scrollY, [600, 1200], [0, 50]);
  
  // Title transform - just a gentle movement
  const titleY = useTransform(scrollY, [700, 1000], [0, -10]);

  return (
    <div id="features" className="relative py-16">
      {/* Single decorative blob for better performance */}
      <motion.div 
        className="absolute top-40 right-10 w-96 h-96 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl -z-10 will-change-transform"
        style={{
          y: bgY,
        }}
      />
      
      <motion.div
        className="relative will-change-transform"
        style={{
          y: featuresY,
        }}
      >
        <motion.div 
          className="text-center mb-16"
          style={{ y: titleY }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-3">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools to handle any content format
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.5,
                delay: Math.min(index * 0.1, 0.3) // Cap delay for smoother appearance
              }}
            >
              <Card 
                spotlight={true} 
                hover={true} 
                className="overflow-hidden h-full dark:border-[#5F8729]/50 dark:bg-[#283618]/90"
              >
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <motion.div 
                      className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0px 5px 15px rgba(124, 170, 56, 0.3)"
                      }}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.iconColor} dark:text-[#9AC556]`} />
                    </motion.div>
                    <CardTitle className="dark:text-[#D4E8AE]">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="dark:text-[#B6D87E]/90 mt-3">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-center justify-center">
                    {/* Placeholder for feature illustration */}
                    <div className="w-full h-full rounded-lg bg-muted/50 dark:bg-[#3D5321]/50 dark:border dark:border-[#5F8729]/60 flex items-center justify-center">
                      <span className="text-[#7CAA38] dark:text-[#9AC556] font-medium">{feature.title}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group dark:bg-[#3D5321] dark:border-[#5F8729]/80 dark:text-[#D4E8AE] dark:hover:bg-[#4A6823] dark:hover:border-[#7CAA38]"
                    asChild
                  >
                    <Link href={feature.href}>
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 