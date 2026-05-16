import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionCookie, getAuthConfig, sessionMaxAgeSeconds } from '@/lib/accessSession'
import { guardApiRequest } from '@/lib/requestGuards'

export async function POST(req: NextRequest) {
  const guarded = await guardApiRequest(req, 'auth-login', { limit: 12, windowMs: 15 * 60 * 1000 })
  if (guarded) return guarded

  const auth = getAuthConfig()

  if (!auth.enabled) {
    return NextResponse.json({ ok: true, disabled: true })
  }

  if (auth.misconfigured) {
    return NextResponse.json({ error: 'DOGANA_ACCESS_TOKEN is not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''

  if (!token || token !== auth.accessToken) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
  }

  const session = await createSessionCookie(auth.accessToken, auth.cookieSecret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: session,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds(),
  })
  return res
}
