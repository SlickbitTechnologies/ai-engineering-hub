'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TextRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/text-summarize');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the Text Summarizer</p>
      </div>
    </div>
  );
} 