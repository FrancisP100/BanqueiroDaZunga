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

/**
 * Activate an account by setting the real bank account number and opening it.
 * Used by leaders when they receive the real account ID from the bank.
 */
export async function ativarContaComId(
  accountId: string,
  numeroConta: string,
  dataActivacao: string,
): Promise<{ error?: string; success?: boolean }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };
  if (!numeroConta.trim()) return { error: "O número de conta é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Get leader info
  const { data: leaderProfile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();
  const leaderNome = leaderProfile?.nome ?? "Líder";

  const adminClient = await getAdminClient();

  // Fetch the account with client data
  const { data: account } = await adminClient
    .from("accounts")
    .select("id, banqueiro_id, status, clientes(nome), profiles(nome)")
    .eq("id", accountId)
    .single();

  if (!account) return { error: "Conta não encontrada." };
  if (account.status === "aberta") return { error: "Esta conta já está activa." };

  const clienteNome = (account as any).clientes?.nome ?? "Cliente";
  const banqueiroNome = (account as any).profiles?.nome ?? "Bankeiro";
  const banqueiroId = account.banqueiro_id;

  // Update account: set number, date, and mark as open
  const { error: updateError } = await adminClient
    .from("accounts")
    .update({
      status: "aberta",
      numero_conta_banco: numeroConta.trim(),
      data_activacao_banco: dataActivacao || null,
    })
    .eq("id", accountId);

  if (updateError) return { error: "Erro ao activar conta: " + updateError.message };

  // Create notification for the banqueiro
  const { error: notifError } = await adminClient
    .from("notifications")
    .insert({
      leader_id: user.id,
      banqueiro_id: banqueiroId,
      leader_nome: leaderNome,
      cliente_nome: clienteNome,
      conta_id: accountId,
      tipo: "conta_ativada" as const,
      mensagem: `Conta activada — ${clienteNome}. Nº de conta: ${numeroConta.trim()}.`,
      descricao: `O líder ${leaderNome} activou a conta de ${clienteNome} com o número bancário ${numeroConta.trim()}${dataActivacao ? `, activada em ${dataActivacao}.` : '.'}`,
      lida: false,
    });

  if (notifError) console.error("Erro ao notificar bankeiro:", notifError);

  revalidatePath("/chefe");
  revalidatePath("/chefe/notificacoes");
  return { success: true };
}

/**
 * Send a notification to the banqueiro that the TPA has arrived at the branch.
 * Sets the TPA status to "no_balcao" (intermediate state).
 * The banqueiro then confirms delivery to the client, changing to "entregue".
 */
export async function notificarTpaNoBalcao(
  accounts: { contaId: string; banqueiroId: string; clienteNome: string; clienteId?: string }[],
): Promise<{ error?: string; count?: number }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };
  if (accounts.length === 0) return { error: "Nenhuma conta seleccionada." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: leaderProfile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();
  const leaderNome = leaderProfile?.nome ?? "Líder";

  const adminClient = await getAdminClient();

  const contaIds = accounts.map((a) => a.contaId);

  // 1. Update all accounts to "no_balcao" status
  const { error: updateError } = await adminClient
    .from("accounts")
    .update({ tpa_status: "no_balcao" })
    .in("id", contaIds);

  if (updateError) return { error: "Erro ao actualizar TPAs: " + updateError.message };

  // 2. Create notifications for each banqueiro
  const inserts = accounts.map(({ banqueiroId, clienteNome, contaId, clienteId }) => ({
    leader_id: user.id,
    banqueiro_id: banqueiroId,
    leader_nome: leaderNome,
    cliente_nome: clienteNome,
    cliente_id: clienteId ?? null,
    conta_id: contaId,
    tipo: "tpa_no_balcao" as const,
    mensagem: `TPA chegou ao balcão — ${clienteNome}. Confirme a entrega ao cliente.`,
    descricao: `O líder ${leaderNome} notificou que o TPA de ${clienteNome} já chegou ao balcão. O Bankeiro deve confirmar a entrega ao cliente para activar o TPA.`,
    lida: false,
  }));

  const { error: notifError } = await adminClient.from("notifications").insert(inserts);
  if (notifError) return { error: "Erro ao enviar notificações: " + notifError.message };

  revalidatePath("/chefe");
  revalidatePath("/chefe/notificacoes");
  return { count: inserts.length };
}
