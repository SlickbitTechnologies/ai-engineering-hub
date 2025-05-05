'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function PDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 