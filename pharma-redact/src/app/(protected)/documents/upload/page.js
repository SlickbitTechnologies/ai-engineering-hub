'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentUpload() {
  const router = useRouter();
  
  // Redirect to the documents page with the upload modal flag
  useEffect(() => {
    router.push('/documents?upload=true');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chateau-green-600"></div>
    </div>
  );
} 