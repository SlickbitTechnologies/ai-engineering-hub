/**
 * API configuration for handling dynamic server usage
 * This helps prevent Next.js static generation errors for API routes
 */

import { NextRequest } from 'next/server';

export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * Helper function to handle API requests with dynamic server usage
 * @param handler The API request handler function
 */
export function dynamicAPIHandler<T>(
    handler: (req: NextRequest) => Promise<Response> | Response
): (req: NextRequest) => Promise<Response> | Response {
    return (req: NextRequest) => {
        // Force dynamic evaluation for all API routes
        return handler(req);
    };
} 