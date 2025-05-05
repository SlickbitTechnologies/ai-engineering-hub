'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 