import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Returns the set of market IDs this leader is allowed to see,
 * based on their assigned market's balcão or explicit leader_id.
 *
 * Método primário: leader_id explícito (sync automático).
 * Fallback: associação por balcão/market (compatibilidade).
 */
export async function getAllowedMarketIds(
  supabase: ReturnType<typeof createBrowserClient>,
): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  // 1. Buscar banqueiros vinculados por leader_id
  const { data: banqueirosVinculados } = await supabase
    .from("profiles")
    .select("local_id")
    .eq("leader_id", user.id)
    .eq("papel", "banqueiro");

  if (banqueirosVinculados && banqueirosVinculados.length > 0) {
    const marketIds = new Set<string>();
    banqueirosVinculados.forEach((b: any) => {
      if (b.local_id) marketIds.add(b.local_id);
    });
    // Se algum banqueiro tem local_id, retornar os mercados deles
    if (marketIds.size > 0) return marketIds;
  }

  // 2. Fallback: leader_id não encontrou nada, usar local_id do líder
  const { data: profile } = await supabase
    .from("profiles")
    .select("local_id")
    .eq("id", user.id)
    .single();
  if (!profile?.local_id) return new Set();

  const { data: leaderMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", profile.local_id)
    .single();
  if (!leaderMarket?.balcao) return new Set([profile.local_id]);

  const { data: sameBalcao } = await supabase
    .from("markets")
    .select("id")
    .eq("balcao", leaderMarket.balcao);

  return new Set((sameBalcao ?? []).map((m: { id: string }) => m.id));
}

/**
 * Verifies that a specific banqueiro belongs to the same leader
 * (by explicit leader_id) or to the same balcão.
 */
export async function verifyBanqueiroAccess(
  supabase: ReturnType<typeof createBrowserClient>,
  banqueiroId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // 1. Verificar leader_id explícito
  const { data: banqueiro } = await supabase
    .from("profiles")
    .select("leader_id, local_id")
    .eq("id", banqueiroId)
    .single();

  if (!banqueiro) return false;

  // Se o banqueiro tem leader_id e corresponde ao líder actual
  if (banqueiro.leader_id === user.id) return true;

  // 2. Fallback: verificar por balcão
  const { data: profile } = await supabase
    .from("profiles")
    .select("local_id")
    .eq("id", user.id)
    .single();
  if (!profile?.local_id) return true; // líder sem local_id vê tudo

  if (!banqueiro.local_id) return false;

  const { data: leaderMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", profile.local_id)
    .single();
  if (!leaderMarket?.balcao) return profile.local_id === banqueiro.local_id;

  const { data: banqueiroMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", banqueiro.local_id)
    .single();

  return banqueiroMarket?.balcao === leaderMarket.balcao;
}
