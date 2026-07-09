import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns the set of market IDs this leader is allowed to see,
 * based on their assigned market's balcão.
 *
 * - If the leader has no local_id, returns empty set (see all).
 * - If the leader's market has no balcão, returns just their market.
 * - Otherwise, returns all markets sharing the same balcão.
 */
export async function getAllowedMarketIds(
  supabase: ReturnType<typeof createBrowserClient>,
): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

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
 * Verifies that a specific banqueiro (with a given local_id) belongs
 * to the same balcão as the current leader.
 */
export async function verifyBanqueiroAccess(
  supabase: ReturnType<typeof createBrowserClient>,
  banqueiroLocalId: string | null,
): Promise<boolean> {
  if (!banqueiroLocalId) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("local_id")
    .eq("id", user.id)
    .single();
  if (!profile?.local_id) return true; // leader sem local_id vê tudo

  const { data: leaderMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", profile.local_id)
    .single();
  if (!leaderMarket?.balcao) return profile.local_id === banqueiroLocalId;

  const { data: banqueiroMarket } = await supabase
    .from("markets")
    .select("balcao")
    .eq("id", banqueiroLocalId)
    .single();

  return banqueiroMarket?.balcao === leaderMarket.balcao;
}
