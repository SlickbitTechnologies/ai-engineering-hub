import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // These paths require authentication
  const protectedPaths = [
    '/dashboard',
    '/documents',
    '/templates'
  ];
  
  // Check if the current path is a protected path
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isProtectedPath) {
    // Check for auth cookie
    const hasAuthCookie = request.cookies.has('auth');
    
    // If the user is not authenticated, redirect to the login page
    if (!hasAuthCookie) {
      console.log(`Middleware: No auth cookie found, redirecting ${pathname} to login`);
      const loginUrl = new URL('/auth', request.url);
      
      // Add the original URL as a parameter to redirect back after login
      loginUrl.searchParams.set('redirectTo', pathname);
      
      return NextResponse.redirect(loginUrl);
    }
    
    // For authenticated users, let the request proceed normally
    return NextResponse.next();
  }

  // Not a protected path, let the request proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match routes that we want to handle
    '/dashboard',
    '/documents/:path*',
    '/templates/:path*',
  ],
}; 