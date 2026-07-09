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

/**
 * Send notifications from the leader to banqueiros about pending TPA clients.
 */
export async function notificarTpasPendentes(
  banqueirosClientes: { banqueiroId: string; clienteNome: string; contaId: string }[],
  mensagem?: string,
): Promise<{ error?: string; count?: number }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };
  if (banqueirosClientes.length === 0) return { error: "Nenhum cliente seleccionado." };

  // Use regular server client to get the authenticated user (preserves session cookies)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const adminClient = await getAdminClient();

  const inserts = banqueirosClientes.map(({ banqueiroId, clienteNome, contaId }) => ({
    leader_id: user.id,
    banqueiro_id: banqueiroId,
    cliente_nome: clienteNome,
    conta_id: contaId,
    mensagem: mensagem ?? `Cliente ${clienteNome} tem TPA pendente — por favor dar seguimento.`,
    lida: false,
  }));

  const { error } = await adminClient.from("notifications").insert(inserts);

  if (error) return { error: "Erro ao enviar notificações: " + error.message };

  revalidatePath("/chefe");
  revalidatePath("/chefe/notificacoes");
  return { count: inserts.length };
}


