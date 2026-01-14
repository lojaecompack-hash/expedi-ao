import { NextRequest, NextResponse } from 'next/server'

import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

function isPublicPath(pathname: string) {
  if (pathname === '/') return true
  if (pathname.startsWith('/login')) return true
  if (pathname.startsWith('/api/tiny/auth')) return true
  if (pathname.startsWith('/api/tiny/callback')) return true
  if (pathname.startsWith('/api/session')) return true
  if (pathname.startsWith('/api/logout')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon.ico')) return true
  if (pathname.startsWith('/public')) return true
  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const { supabase, res } = createSupabaseMiddlewareClient(req)

  // Note: getUser() validates the access token with Supabase Auth
  return supabase.auth.getUser().then(({ data }) => {
    if (data.user) return res

    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/tiny-test/:path*', '/expedicao/:path*'],
}
