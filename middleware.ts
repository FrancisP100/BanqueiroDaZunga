import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

// Rotas públicas que não precisam de autenticação
const PUBLIC_PATHS = [
  "/banqueiro/login",
  "/banqueiro/register",
  "/chefe/login",
  "/chefe/register",
  "/admin/login",
  "/onboarding",
  "/login",
  "/",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — passar sem verificação
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se Supabase não estiver configurado, deixar passar (modo mock)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
          response.cookies.set(name, value, {
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  // Refresh da sessão — getUser() faz refresh automático se necessário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Verificar se o perfil do utilizador está ativo
  const { data: profile } = await supabase
    .from("profiles")
    .select("ativo")
    .eq("id", user.id)
    .single();

  if (profile && !profile.ativo) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "conta_bloqueada");
    return NextResponse.redirect(url);
  }

  // Sincronizar a sessão: propagar cookies actualizados
  return response;
}

export const config = {
  matcher: ["/banqueiro/:path*", "/chefe/:path*", "/admin/:path*"],
};
