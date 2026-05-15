import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'ds_auth';

export async function GET(request: NextRequest) {
  const expected = process.env.DATASENSE_API_TOKEN;
  // Auth disabled — everyone is "authenticated"
  if (!expected) {
    return NextResponse.json({ authenticated: true, gateEnabled: false });
  }
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  return NextResponse.json({
    authenticated: cookie === expected,
    gateEnabled: true,
  });
}
