import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

// Rotas que não requerem autenticação
const PUBLIC_PATHS = [
  "/banqueiro/login",
  "/banqueiro/register",
  "/chefe/login",
  "/chefe/register",
  "/admin/login",
  "/onboarding",
  "/login",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — passar sem verificação
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  // Criar response mutável para poder propagar cookies de sessão
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        // Primeiro actualizar os cookies no request
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Depois criar nova response com os cookies actualizados
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Verificar sessão — getUser() é mais seguro que getSession()
  const { data: { user } } = await supabase.auth.getUser();

  // Utilizador não autenticado a tentar aceder a rota protegida
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Utilizador autenticado — propagar cookies actualizados e deixar passar
  // O RBAC (verificação de role) é feito nos layouts de cada área
  return response;
}

export const config = {
  matcher: [
    "/banqueiro/:path*",
    "/chefe/:path*",
    "/admin/:path*",
  ],
};
