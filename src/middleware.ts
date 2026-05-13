import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Protect authed-only routes. Anyone hitting them while signed-out is sent to
 * /login with a `?next=` param so we can return them after sign-in.
 *
 * Also redirects signed-in users away from /login and /signup.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isAuthed = !!req.auth?.user;

  const protectedPrefixes = ['/me', '/organizer', '/admin', '/scanner/app'];
  const guestOnlyPaths = ['/login', '/signup'];

  if (!isAuthed && protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  if (isAuthed && guestOnlyPaths.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/me';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Skip static assets and the Auth.js route handler itself.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
