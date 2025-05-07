import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
    '/',  // Make the homepage protected
    '/text',
    '/text-summarize',
    '/pdf',
    '/pdf-summarize',
    '/audio',
    '/audio-summarize',
    '/youtube-summarize',
    '/web-scrape',
    '/translate',
    '/history',
];

// Public routes that should always be accessible
const PUBLIC_ROUTES = ['/login', '/signup', '/auth'];

// This middleware ensures that routes requiring dynamic data
// are properly handled with server-side rendering
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes and static assets
    if (pathname.startsWith('/api') || pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
        return NextResponse.next();
    }

    // Skip middleware for public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check if the current path is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route) || pathname === '/'
    );

    // Check if user is authenticated by looking for the session cookie
    const authCookie = request.cookies.get('auth_session')?.value;

    // If it's a protected route and user is not authenticated, redirect to auth
    if (isProtectedRoute && !authCookie) {
        const url = new URL('/auth', request.url);

        // Pass the original URL as a query param to redirect back after login
        url.searchParams.set('callbackUrl', pathname);

        // Create a response that redirects to the auth page
        const response = NextResponse.redirect(url);

        // Add a more descriptive cookie to show toast message on the auth page
        response.cookies.set('auth_redirect', 'Please log in to access this feature.', {
            path: '/',
            maxAge: 10, // Short-lived cookie just for the toast
            httpOnly: false,
        });

        return response;
    }

    return NextResponse.next();
}

// Specify which routes to run the middleware on
export const config = {
    // Apply to all routes except for assets, _next, and api routes
    matcher: ['/((?!_next/static|_next/image|images|assets|favicon.ico|sw.js).*)'],
}; 