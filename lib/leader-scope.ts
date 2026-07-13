import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Returns the set of market IDs this leader is allowed to see,
 * based on their assigned market's balcão or explicit leader_id.
 *
 * Retorna { marketIds, isUnrestricted }:
 * - isUnrestricted = true  → o utilizador NÃO é um líder (admin) — pode ver tudo
 * - isUnrestricted = false e marketIds vazio → líder sem configuração — não vê nada
 * - isUnrestricted = false e marketIds com IDs → líder restrito ao seu balcão
 */
export async function getAllowedMarketIds(
  supabase: ReturnType<typeof createBrowserClient>,
): Promise<{ marketIds: Set<string>; isUnrestricted: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { marketIds: new Set(), isUnrestricted: false };

  // Verificar se o utilizador é líder ou admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("papel, local_id")
    .eq("id", user.id)
    .single();

  // Se não for líder (admin), é irrestrito — não filtrar
  if (!profile || profile.papel !== "chefe") {
    return { marketIds: new Set(), isUnrestricted: true };
  }

  // É líder — vamos determinar os mercados a que tem acesso

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
    if (marketIds.size > 0) return { marketIds, isUnrestricted: false };
  }

  // 2. Fallback: leader_id não encontrou nada, usar local_id do líder
  if (!profile.local_id) {
    // Líder sem local_id nem banqueiros vinculados — não vê nada
    return { marketIds: new Set(), isUnrestricted: false };
  }

  const { data: leaderMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", profile.local_id)
    .single();
  if (!leaderMarket?.balcao) return { marketIds: new Set([profile.local_id]), isUnrestricted: false };

  const { data: sameBalcao } = await supabase
    .from("markets")
    .select("id")
    .eq("balcao", leaderMarket.balcao);

  return {
    marketIds: new Set((sameBalcao ?? []).map((m: { id: string }) => m.id)),
    isUnrestricted: false,
  };
}

/**
 * Verifies that a specific banqueiro belongs to the same leader
 * (by explicit leader_id) or to the same balcão.
 *
 * Retorna true apenas se o banqueiro pertence ao balcão do líder.
 * Líderes sem configuração (sem local_id) NÃO têm acesso a ninguém.
 */
export async function verifyBanqueiroAccess(
  supabase: ReturnType<typeof createBrowserClient>,
  banqueiroId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Verificar perfil do líder
  const { data: profile } = await supabase
    .from("profiles")
    .select("papel, local_id")
    .eq("id", user.id)
    .single();
  if (!profile) return false;

  // Se não é líder (admin), permitir sempre
  if (profile.papel !== "chefe") return true;

  // Líder sem local_id não tem acesso a ninguém
  if (!profile.local_id) return false;

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
