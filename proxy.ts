import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedRoutes = [
  { prefix: "/banqueiro", role: "banqueiro" },
  { prefix: "/chefe", role: "chefe" },
  { prefix: "/admin", role: "admin" },
] as const;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bypassAuth =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "1" ||
    process.env.NODE_ENV === "development";

  if (!supabaseUrl || !supabaseKey || bypassAuth) return response;

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

  if (
    request.nextUrl.pathname.startsWith("/banqueiro/register") ||
    request.nextUrl.pathname.startsWith("/chefe/register")
  ) {
    return response;
  }

  const match = protectedRoutes.find((route) =>
    request.nextUrl.pathname.startsWith(route.prefix),
  );
  if (!match) return response;

  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", data.user.id)
    .single();
  if (profile?.papel !== match.role) {
    return NextResponse.redirect(
      new URL(`/${profile?.papel ?? "login"}`, request.url),
    );
  }

  return response;
}

export const config = {
  matcher: ["/banqueiro/:path*", "/chefe/:path*", "/admin/:path*"],
};
