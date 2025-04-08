'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AudioRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/audio-summarize');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the Audio Summarizer</p>
      </div>
    </div>
  );
} 