'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { Loader2 } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  isLoading?: boolean;
  badge?: number | string;
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  isLoading = false,
  badge,
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5',
  };

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    outline: 'border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
    destructive: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-70 hover-float active:translate-y-0.5',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          {icon}
          {badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
} 