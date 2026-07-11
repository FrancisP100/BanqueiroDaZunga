import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses @supabase/ssr's createBrowserClient which stores auth in both
 * cookies and memory via the `@supabase/ssr` package.
 *
 * Compatibilidade:
 * - Safari/iOS: usa cookies first‑party (não depende de third‑party cookies)
 * - A middleware.ts faz o refresh da sessão em cada requisição
 */
export function createBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  return createSsrBrowserClient(supabaseUrl, supabaseAnonKey);
}