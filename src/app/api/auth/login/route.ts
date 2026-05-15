import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'ds_auth';

export async function POST(request: NextRequest) {
  const expected = process.env.DATASENSE_API_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Auth is disabled on this server (DATASENSE_API_TOKEN is unset).' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const token = typeof body?.token === 'string' ? body.token : '';

  // Constant-time-ish compare to discourage timing oracles on short tokens.
  // Node's crypto.timingSafeEqual requires equal-length buffers, so guard first.
  if (token.length !== expected.length) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
