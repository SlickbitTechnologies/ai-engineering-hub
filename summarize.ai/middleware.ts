import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that should always be accessible
const PUBLIC_ROUTES = ['/auth', '/login', '/signup'];

// This middleware ensures that routes requiring dynamic data
// are properly handled with server-side rendering
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes and static assets
    if (pathname.startsWith('/api') ||
        pathname.includes('/_next') ||
        pathname.includes('/favicon.ico') ||
        pathname.includes('/images') ||
        pathname.includes('/assets')) {
        return NextResponse.next();
    }

    // Check if user is authenticated by looking for the session cookie
    const authCookie = request.cookies.get('auth_session')?.value;

    // If user is not authenticated and trying to access a protected route
    if (!authCookie && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        const url = new URL('/auth', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Specify which routes to run the middleware on
export const config = {
    // Apply to all routes except for assets, _next, and api routes
    matcher: ['/((?!_next/static|_next/image|images|assets|favicon.ico|sw.js).*)'],
}; 