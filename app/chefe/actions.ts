"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

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
 * Send notifications from the leader to banqueiros about pending TPA clients.
 * Now includes tipo, descricao and leader_nome for the expanded notification system.
 */
export async function notificarTpasPendentes(
  banqueirosClientes: { banqueiroId: string; clienteNome: string; contaId: string; clienteId?: string }[],
  mensagem?: string,
): Promise<{ error?: string; count?: number }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };
  if (banqueirosClientes.length === 0) return { error: "Nenhum cliente seleccionado." };

  // Use regular server client to get the authenticated user (preserves session cookies)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Get the leader's name
  const { data: leaderProfile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();
  const leaderNome = leaderProfile?.nome ?? "Líder";

  const adminClient = await getAdminClient();

  const inserts = banqueirosClientes.map(({ banqueiroId, clienteNome, contaId, clienteId }) => ({
    leader_id: user.id,
    banqueiro_id: banqueiroId,
    cliente_nome: clienteNome,
    cliente_id: clienteId ?? null,
    conta_id: contaId,
    tipo: "alerta_tpa" as const,
    leader_nome: leaderNome,
    descricao: `O líder ${leaderNome} notificou sobre o TPA pendente de ${clienteNome}. Por favor, entregue o TPA ao cliente e actualize o estado no sistema.`,
    mensagem: mensagem ?? `Cliente ${clienteNome} tem TPA pendente — por favor dar seguimento.`,
    lida: false,
  }));

  const { error } = await adminClient.from("notifications").insert(inserts);

  if (error) return { error: "Erro ao enviar notificações: " + error.message };

  revalidatePath("/chefe");
  revalidatePath("/chefe/notificacoes");
  return { count: inserts.length };
}
