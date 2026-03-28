import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Public routes: allow without session
  const publicPaths = ['/auth/signin', '/auth/signup', '/auth/verify', '/auth/callback'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If you guard other routes, do it here (or rely on page-level guards).
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
