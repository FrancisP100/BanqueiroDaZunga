import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Páginas públicas que não requerem autenticação
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/onboarding',
  '/banqueiro/login',
  '/banqueiro/register',
  '/chefe/login',
  '/chefe/register',
  '/admin/login',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas estáticas e de API passam sem verificação
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se o Supabase não estiver configurado, deixa passar tudo
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Utilizador não autenticado a tentar aceder a rota protegida
  if (!user && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Utilizador autenticado
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('papel')
      .eq('id', user.id)
      .single()

    const role = profile?.papel

    // Se já está autenticado e tenta aceder a qualquer página de login/register,
    // redirigir directamente para a sua área
    const isLoginOrRegister =
      pathname === '/login' ||
      pathname.startsWith('/banqueiro/login') ||
      pathname.startsWith('/banqueiro/register') ||
      pathname.startsWith('/chefe/login') ||
      pathname.startsWith('/chefe/register') ||
      pathname.startsWith('/admin/login') ||
      pathname.startsWith('/onboarding')

    if (isLoginOrRegister) {
      if (role === 'banqueiro') return NextResponse.redirect(new URL('/banqueiro', request.url))
      if (role === 'chefe') return NextResponse.redirect(new URL('/chefe', request.url))
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      return NextResponse.redirect(new URL('/', request.url))
    }

    // RBAC — impede acesso a áreas de outros roles
    if (pathname.startsWith('/banqueiro') && role !== 'banqueiro') {
      return NextResponse.redirect(new URL(`/${role ?? ''}`, request.url))
    }
    if (pathname.startsWith('/chefe') && role !== 'chefe') {
      return NextResponse.redirect(new URL(`/${role ?? ''}`, request.url))
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role ?? ''}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
