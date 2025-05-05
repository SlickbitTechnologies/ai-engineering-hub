'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React from 'react';

export function ThemeProvider({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode,
  attribute?: string,
  defaultTheme?: string,
  enableSystem?: boolean,
  disableTransitionOnChange?: boolean
}) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
} 