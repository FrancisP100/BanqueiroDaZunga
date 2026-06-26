import { hmToMinutes, nowHM, todayISO } from "@/lib/date";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function ensureAutomaticAbsences() {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const { data: settings } = await supabase.from("punctuality_settings").select("hora_limite,tolerancia_min").eq("id", true).single();
  if (!settings) return;

  const limit = hmToMinutes(String(settings.hora_limite).slice(0, 5));
  const current = hmToMinutes(nowHM());
  if (limit === null || current === null || current <= limit + Number(settings.tolerancia_min)) return;

  const today = todayISO();
  const [{ data: bankers }, { data: presences }] = await Promise.all([
    supabase.from("profiles").select("id,local_id").eq("papel", "banqueiro").eq("ativo", true),
    supabase.from("presences").select("profile_id").eq("data", today)
  ]);

  const presentIds = new Set((presences ?? []).map((presence) => presence.profile_id));
  const missingRows = (bankers ?? [])
    .filter((banker) => !presentIds.has(banker.id))
    .map((banker) => ({
      profile_id: banker.id,
      data: today,
      mercado_id: banker.local_id,
      status: "falta",
      pontualidade: "falta",
      origem: "automatica"
    }));

  if (missingRows.length) {
    await supabase.from("presences").upsert(missingRows, { onConflict: "profile_id,data" });
  }
}
