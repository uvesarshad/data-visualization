import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'ds_auth';
const AUTH_HEADER_PREFIX = 'Bearer ';

/**
 * Shared-secret token gate for /api/analyses/*.
 *
 * - If DATASENSE_API_TOKEN is unset, all requests pass (dev-mode bypass).
 *   A warning is logged on the server once per request (cheap, useful).
 * - Otherwise, request must carry either:
 *     Cookie:        ds_auth=<token>
 *     Authorization: Bearer <token>
 *   and the value must equal DATASENSE_API_TOKEN.
 *
 * The token is never sent back to the client; only the existence of a valid
 * cookie is observable via /api/auth/me.
 */
export function middleware(req: NextRequest) {
  const expected = process.env.DATASENSE_API_TOKEN;

  if (!expected) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[auth] DATASENSE_API_TOKEN is unset; /api/analyses/* is unprotected. ' +
        'Set it in .env.local to enable the auth gate.'
      );
    }
    return NextResponse.next();
  }

  const fromCookie = req.cookies.get(AUTH_COOKIE)?.value;
  const fromHeader = req.headers.get('authorization');
  const headerToken = fromHeader?.startsWith(AUTH_HEADER_PREFIX)
    ? fromHeader.slice(AUTH_HEADER_PREFIX.length)
    : null;

  if (fromCookie === expected || headerToken === expected) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: 'Unauthorized', detail: 'Missing or invalid auth token.' },
    { status: 401 }
  );
}

export const config = {
  matcher: ['/api/analyses/:path*'],
};
