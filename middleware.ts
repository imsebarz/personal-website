import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en'
  const res = NextResponse.next()
  res.headers.set('x-locale', locale)
  res.cookies.set('locale', locale, { path: '/' }) // still set for potential client usage
  return res
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}