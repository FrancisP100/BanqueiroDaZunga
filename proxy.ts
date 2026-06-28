import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

// Páginas de login/register por role — sempre públicas
const LOGIN_REGISTER_PATHS = [
  "/banqueiro/login",
  "/banqueiro/register",
  "/chefe/login",
  "/chefe/register",
  "/admin/login",
  "/onboarding",
  "/login",
];

function isLoginOrRegister(pathname: string): boolean {
  return LOGIN_REGISTER_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

const protectedRoutes = [
  { prefix: "/banqueiro", role: "banqueiro" },
  { prefix: "/chefe", role: "chefe" },
  { prefix: "/admin", role: "admin" },
] as const;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se o Supabase não estiver configurado, deixa passar tudo
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Utilizador autenticado a tentar aceder a página de login/register
  // → redirigir directamente para a sua área
  if (user && isLoginOrRegister(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("papel")
      .eq("id", user.id)
      .single();

    const role = profile?.papel;
    if (role === "banqueiro") return NextResponse.redirect(new URL("/banqueiro", request.url));
    if (role === "chefe") return NextResponse.redirect(new URL("/chefe", request.url));
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    return response;
  }

  // Páginas de login/register são públicas — não verificar mais nada
  if (isLoginOrRegister(pathname)) return response;

  // Verificar se é uma rota protegida
  const match = protectedRoutes.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (!match) return response;

  // Utilizador não autenticado a tentar aceder a rota protegida
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // RBAC — utilizador autenticado mas com role errado
  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== match.role) {
    return NextResponse.redirect(
      new URL(`/${profile?.papel ?? "login"}`, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/banqueiro/:path*",
    "/chefe/:path*",
    "/admin/:path*",
    "/login",
    "/onboarding",
  ],
};
