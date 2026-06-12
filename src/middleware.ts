import { NextResponse, type NextRequest } from 'next/server';

import { verifyAccessTokenEdge } from '@/lib/auth/edge-jwt';

const PROTECTED_PREFIX = '/documents';
const AUTH_PAGES = ['/login', '/register'];

/**
 * Optimistic page protection. Real authorization happens server-side in
 * the API routes (requireAuth) — this only handles UX redirects.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasRefreshToken = Boolean(request.cookies.get('refreshToken')?.value);

  // Authenticated users don't need the auth pages.
  if (AUTH_PAGES.includes(pathname) && accessToken) {
    try {
      await verifyAccessTokenEdge(accessToken);
      return NextResponse.redirect(new URL('/documents', request.url));
    } catch {
      // Invalid token — let them see the page.
    }
  }

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  if (!accessToken) {
    // Refresh token present: let the request through so the client-side
    // interceptor can run the 401 → refresh → retry flow.
    if (hasRefreshToken) {
      return NextResponse.next();
    }

    return redirectToLogin(request, pathname);
  }

  try {
    const payload = await verifyAccessTokenEdge(accessToken);

    // Expose identity to server components.
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);

    return response;
  } catch {
    if (hasRefreshToken) {
      const response = NextResponse.next();
      response.cookies.delete('accessToken');
      return response;
    }

    const response = redirectToLogin(request, pathname);
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;
  }
}

function redirectToLogin(request: NextRequest, from: string): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', from);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/documents/:path*', '/documents', '/login', '/register'],
};
