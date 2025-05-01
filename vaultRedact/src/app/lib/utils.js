import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with tailwind merging
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 