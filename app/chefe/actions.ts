"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { PresenceStatus, Punctuality } from "@/lib/types";

async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return await createClient();
}

/**
 * Update an existing presence record (status, pontualidade, optional observation).
 */
export async function updatePresence(
  presenceId: string,
  status: PresenceStatus,
  pontualidade: Punctuality,
  observacao?: string
): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return {};

  const adminClient = await getAdminClient();

  const { error } = await adminClient
    .from("presences")
    .update({
      status,
      pontualidade,
      origem: "manual",
      ...(observacao !== undefined ? { observacao } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", presenceId);

  if (error) return { error: "Erro ao actualizar presença: " + error.message };

  revalidatePath("/chefe");
  revalidatePath("/chefe/presencas");
  return {};
}

/**
 * Create a manual presence record for a banqueiro who has no presence for a given date.
 */
export async function createManualPresence(
  profileId: string,
  date: string,
  status: PresenceStatus,
  pontualidade: Punctuality,
  mercadoId?: string,
  observacao?: string
): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return {};

  const adminClient = await getAdminClient();

  const { error } = await adminClient.from("presences").insert({
    profile_id: profileId,
    data: date,
    status,
    pontualidade,
    origem: "manual",
    mercado_id: mercadoId ?? null,
    ...(observacao ? { observacao } : {}),
  });

  if (error) return { error: "Erro ao criar presença manual: " + error.message };

  revalidatePath("/chefe");
  revalidatePath("/chefe/presencas");
  return {};
}
