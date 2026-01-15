import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

function isPublicPath(pathname: string) {
  if (pathname === '/') return true
  if (pathname.startsWith('/login')) return true
  if (pathname.startsWith('/api/auth')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon.ico')) return true
  return false
}

function canAccessPath(pathname: string, role: 'ADMIN' | 'EXPEDICAO'): boolean {
  // ADMIN pode acessar tudo
  if (role === 'ADMIN') return true
  
  // EXPEDICAO só pode acessar expedição
  if (role === 'EXPEDICAO') {
    return pathname.startsWith('/expedicao')
  }
  
  return false
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Verificar token
  const token = req.cookies.get('auth-token')?.value || 
                  req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Verificar token válido
  const payload = verifyToken(token)
  if (!payload) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Verificar permissão de acesso
  if (!canAccessPath(pathname, payload.role)) {
    if (payload.role === 'EXPEDICAO') {
      // Redirecionar para expedição se tentar acessar outras páginas
      return NextResponse.redirect(new URL('/expedicao/retirada', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Adicionar informações do usuário nos headers
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.userId)
  response.headers.set('x-user-email', payload.email)
  response.headers.set('x-user-role', payload.role)

  return response
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
