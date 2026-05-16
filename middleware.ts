import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getAuthConfig, verifySessionCookie } from './src/lib/accessSession'

const PUBLIC_PATHS = ['/login', '/privacy', '/terms', '/impressum']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) return true
  if (pathname.startsWith('/api/auth/')) return true
  return false
}

export async function middleware(req: NextRequest) {
  const auth = getAuthConfig()
  const { pathname } = req.nextUrl

  if (!auth.enabled || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (auth.misconfigured) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('setup', 'missing')
    return NextResponse.redirect(url)
  }

  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value
  const valid = await verifySessionCookie(cookie, auth.accessToken, auth.cookieSecret)

  if (valid) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('next', `${pathname}${req.nextUrl.search}`)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?|json)$).*)',
  ],
}
