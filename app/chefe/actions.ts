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
