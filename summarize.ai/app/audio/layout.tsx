'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function AudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 