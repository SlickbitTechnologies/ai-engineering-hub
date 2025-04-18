import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Handle redirects to protected paths
  if (pathname === '/dashboard' || 
      pathname.startsWith('/documents') || 
      pathname.startsWith('/templates')) {
    
    // Route groups are not visible in actual URLs, so we need to adapt paths
    // that match our protected routes. We'll check if the path is already
    // in the correct format to prevent loops.
    
    // The rewrite should be a server-side rewrite - client doesn't see the route group
    const newUrl = new URL(request.url);
    newUrl.pathname = pathname; // Keep the original pathname
    
    // This will serve content from the (protected) route group while preserving the URL
    return NextResponse.rewrite(newUrl);
  }

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