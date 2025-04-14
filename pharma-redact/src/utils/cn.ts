import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that combines clsx and tailwind-merge for conditionally joining classNames 
 * and resolving Tailwind CSS class conflicts
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 