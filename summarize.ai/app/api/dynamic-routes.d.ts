// This file extends the Next.js types to allow dynamic server usage in API routes
// It's a workaround for the static generation errors during build

import 'next';

declare module 'next' {
    interface NextConfig {
        experimental?: {
            appDir?: boolean;
            serverComponentsExternalPackages?: string[];
            allowDynamicServerUsage?: boolean;
        };
    }
} 