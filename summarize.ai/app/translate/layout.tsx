'use client';

import { AuthGuard } from '@/app/components/AuthGuard';

export default function TranslateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
} 