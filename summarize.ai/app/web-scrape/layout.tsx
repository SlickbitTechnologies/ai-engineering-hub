'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function WebScrapeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 