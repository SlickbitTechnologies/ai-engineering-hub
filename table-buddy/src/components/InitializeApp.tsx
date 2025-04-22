'use client';

import { useEffect } from 'react';
import { initializeOperatingHours } from '@/lib/dbQueries';

export default function InitializeApp() {
  useEffect(() => {
    // Initialize default operating hours
    initializeOperatingHours().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
} 