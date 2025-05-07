/**
 * App-wide configuration
 * This file marks all pages as dynamically rendered
 * to prevent static generation errors
 */

// Export dynamic rendering directive for all pages that import this file
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Force server-side rendering for all routes
export const config = {
    runtime: 'nodejs',
};

// This helps prevent "Cannot access 'h' before initialization" errors
export function forceDynamicRendering() {
    return {
        props: {
            // Adding a timestamp ensures the page is always dynamically rendered
            timestamp: Date.now(),
        },
    };
} 