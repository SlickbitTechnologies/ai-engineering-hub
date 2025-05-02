'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function PDFSummarizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 