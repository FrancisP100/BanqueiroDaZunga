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

export async function createAccount(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, local_id")
    .eq("id", auth.user.id)
    .single();
  if (!profile) return;

  const bi = String(formData.get("bi") ?? "");
  const nome = String(formData.get("cliente_nome") ?? "");
  const telefone = String(formData.get("telefone") ?? "");
  const endereco = String(formData.get("endereco") ?? "");
  const biEmissao = String(formData.get("bi_emissao") ?? "") || null;
  const biValidade = String(formData.get("bi_validade") ?? "") || null;
  const pacote = String(formData.get("pacote") ?? "Mãezinha");
  const mercadoId = String(
    formData.get("mercado_id") ?? profile.local_id ?? "",
  );

  // 1. Upsert cliente (com dados do BI)
  const { data: existingClient } = await supabase
    .from("clientes")
    .select("id")
    .eq("bi", bi)
    .maybeSingle();

  let clienteId: string;
  if (existingClient) {
    clienteId = existingClient.id;
    await supabase
      .from("clientes")
      .update({
        nome,
        telefone,
        endereco,
        bi_emissao: biEmissao,
        bi_validade: biValidade,
      })
      .eq("id", clienteId);
  } else {
    const { data: novoCliente, error } = await supabase
      .from("clientes")
      .insert({
        bi,
        nome,
        telefone,
        endereco,
        bi_emissao: biEmissao,
        bi_validade: biValidade,
      })
      .select("id")
      .single();
    if (error || !novoCliente) return;
    clienteId = novoCliente.id;
  }

  // 2. Criar conta — entra sempre como "pendente"
  const agora = new Date();
  const { data: newAccount } = await supabase.from("accounts").insert({
    banqueiro_id: profile.id,
    cliente_id: clienteId,
    pacote,
    mercado_id: mercadoId || null,
    status: "pendente",
    tpa_status: "pendente",
    hora_abertura: agora.toTimeString().slice(0, 8),
  }).select("id").single();

  // 3. Criar notificação de abertura de conta para o banqueiro
  if (newAccount) {
    const adminClient = await getAdminClient();
    await adminClient.from("notifications").insert({
      leader_id: profile.id,
      banqueiro_id: profile.id,
      cliente_nome: nome,
      cliente_id: clienteId,
      conta_id: newAccount.id,
      tipo: "abertura_conta",
      leader_nome: "Sistema",
      mensagem: `Conta aberta para ${nome} — classe ${pacote}.`,
      descricao: `Registo de nova conta para a cliente ${nome}. Classe: ${pacote}. O TPA está pendente — entregue o terminal e actualize o estado no sistema.`,
      lida: false,
    }).then(({ error: notifErr }) => {
      if (notifErr) console.error("Erro ao criar notificação de abertura:", notifErr);
    });
  }

  revalidatePath("/banqueiro");
  revalidatePath("/banqueiro/clientes");
}

/** Só o banqueiro dono da conta pode passar de "pendente" para "aberta" */
export async function ativarConta(accountId: string) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  // Use regular client for auth verification (picks up session cookies)
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  // Use admin client for the actual update (bypasses RLS)
  const adminClient = await getAdminClient();

  const { data: account } = await adminClient
    .from("accounts")
    .select("id, banqueiro_id, status")
    .eq("id", accountId)
    .single();

  if (!account) return { error: "Conta não encontrada" };
  if (account.banqueiro_id !== auth.user.id)
    return { error: "Só o banqueiro responsável pode activar esta conta" };
  if (account.status === "aberta") return {};

  const { error } = await adminClient
    .from("accounts")
    .update({ status: "aberta" })
    .eq("id", accountId);
  if (error) return { error: error.message };

  revalidatePath("/banqueiro/clientes");
  return {};
}

/** Editar dados de um cliente */
export async function editarCliente(formData: FormData) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  const clienteId  = String(formData.get("cliente_id") ?? "");
  const nome       = String(formData.get("nome")       ?? "").trim();
  const bi         = String(formData.get("bi")         ?? "").trim();
  const telefone   = String(formData.get("telefone")   ?? "").trim();
  const endereco   = String(formData.get("endereco")   ?? "").trim();
  const biEmissao  = String(formData.get("bi_emissao") ?? "").trim() || null;
  const biValidade = String(formData.get("bi_validade") ?? "").trim() || null;

  if (!clienteId) return { error: "ID do cliente é obrigatório." };
  if (!nome)      return { error: "O nome é obrigatório." };

  const { error } = await supabase
    .from("clientes")
    .update({ nome, bi, telefone, endereco, bi_emissao: biEmissao, bi_validade: biValidade })
    .eq("id", clienteId);

  if (error) return { error: "Erro ao actualizar cliente: " + error.message };

  revalidatePath("/banqueiro/clientes");
  return {};
}

/** Eliminar um cliente e todas as suas contas */
export async function eliminarCliente(clienteId: string) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  // Verificar que as contas pertencem a este banqueiro
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", auth.user.id)
    .single();
  if (!profile) return { error: "Perfil não encontrado" };

  // Remover notificações associadas (usar adminClient para bypass RLS)
  const adminClient = await getAdminClient();
  const contas = await supabase
    .from("accounts")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("banqueiro_id", profile.id);

  if (contas.data && contas.data.length > 0) {
    const contaIds = contas.data.map((c: any) => c.id);
    await adminClient.from("notifications").delete().in("conta_id", contaIds).then(({ error: notifErr }) => {
      if (notifErr) console.error("Erro ao limpar notificações das contas:", notifErr);
    });
  }

  // Remover notificações associadas ao cliente
  await adminClient.from("notifications").delete().eq("cliente_id", clienteId).then(({ error: notifErr }) => {
    if (notifErr) console.error("Erro ao limpar notificações do cliente:", notifErr);
  });

  // Apagar contas associadas a este cliente E a este banqueiro
  const { error: delAccountsError } = await supabase
    .from("accounts")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("banqueiro_id", profile.id);

  if (delAccountsError) return { error: "Erro ao eliminar contas: " + delAccountsError.message };

  // Apagar o cliente
  const { error: delClienteError } = await supabase
    .from("clientes")
    .delete()
    .eq("id", clienteId);

  if (delClienteError) return { error: "Erro ao eliminar cliente: " + delClienteError.message };

  revalidatePath("/banqueiro/clientes");
  return {};
}

/** Eliminar uma conta específica */
export async function eliminarConta(accountId: string) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  const { data: account } = await supabase
    .from("accounts")
    .select("id, banqueiro_id")
    .eq("id", accountId)
    .single();

  if (!account) return { error: "Conta não encontrada" };
  if (account.banqueiro_id !== auth.user.id)
    return { error: "Só o banqueiro responsável pode eliminar esta conta" };

  // Remover notificações associadas antes de eliminar a conta (evita FK violation)
  const adminClient = await getAdminClient();
  await adminClient.from("notifications").delete().eq("conta_id", accountId).then(({ error: notifErr }) => {
    if (notifErr) console.error("Erro ao limpar notificações da conta:", notifErr);
  });

  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) return { error: "Erro ao eliminar conta: " + error.message };

  revalidatePath("/banqueiro/clientes");
  return {};
}

/** Banqueiro actualiza o estado do TPA e notifica o líder */
export async function atualizarTpaStatus(
  accountId: string,
  status: "pendente" | "entregue",
) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  // 1. Actualizar o estado do TPA
  const { error } = await supabase
    .from("accounts")
    .update({ tpa_status: status })
    .eq("id", accountId);
  if (error) return { error: error.message };

  // 2. Se marcou como entregue, criar notificações
  if (status === "entregue") {
    try {
      const adminClient = await getAdminClient();

      // Buscar conta com dados do cliente
      const { data: account } = await adminClient
        .from("accounts")
        .select("id, cliente_id, clientes(nome)")
        .eq("id", accountId)
        .single();

      if (account) {
        const clienteNome = (account as any).clientes?.nome ?? "desconhecido";
        const clienteId = account.cliente_id;

        // Buscar perfil do banqueiro (nome e leader_id)
        const { data: profile } = await adminClient
          .from("profiles")
          .select("id, nome, leader_id")
          .eq("id", auth.user.id)
          .single();

        const banqueiroNome = profile?.nome ?? "Bankeiro";
        const baseNotif = {
          leader_id: auth.user.id,
          cliente_nome: clienteNome,
          cliente_id: clienteId,
          conta_id: accountId,
          tipo: "tpa_entregue" as const,
          leader_nome: banqueiroNome,
          mensagem: `TPA entregue — ${clienteNome}`,
          descricao: `O bankeiro ${banqueiroNome} marcou o TPA como entregue para a cliente ${clienteNome}.`,
          lida: false,
        };

        // Notificação #1: para o líder (se existir)
        if (profile?.leader_id) {
          await adminClient.from("notifications").insert({
            ...baseNotif,
            banqueiro_id: profile.leader_id,
          }).then(({ error: notifErr }) => {
            if (notifErr) console.error("Erro ao notificar líder:", notifErr);
          });
        }

        // Notificação #2: para o próprio bankeiro (visível ao admin via service_role)
        await adminClient.from("notifications").insert({
          ...baseNotif,
          banqueiro_id: auth.user.id,
        }).then(({ error: notifErr }) => {
          if (notifErr) console.error("Erro ao criar notificação de TPA entregue:", notifErr);
        });
      }
    } catch (e) {
      console.error("Erro ao criar notificação de TPA entregue:", e);
    }
  }

  revalidatePath("/banqueiro/clientes");
  revalidatePath("/banqueiro");
  return {};
}

/** Marcar presença por GPS */
export async function registerPresence(formData: FormData) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  const mercadoId = String(formData.get("mercado_id") ?? "");
  const latitude = parseFloat(String(formData.get("latitude") ?? "0"));
  const longitude = parseFloat(String(formData.get("longitude") ?? "0"));

  if (!mercadoId) return { error: "Mercado não especificado" };

  const hoje = new Date().toISOString().slice(0, 10);
  const agora = new Date().toTimeString().slice(0, 8);

  const { error } = await supabase.from("presences").upsert(
    {
      profile_id: auth.user.id,
      data: hoje,
      entrada: agora,
      latitude,
      longitude,
      mercado_id: mercadoId,
      status: "no_local",
      pontualidade: "no_horario",
      origem: "gps",
    },
    { onConflict: "profile_id,data" },
  );

  if (error) return { error: error.message };

  revalidatePath("/banqueiro");
  return { success: true };
}

/**
 * Mark a single notification as read for the current banqueiro.
 */
export async function marcarNotificacaoLida(
  notificationId: string,
): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("id", notificationId);

  if (error) return { error: "Erro ao marcar notificação lida: " + error.message };

  revalidatePath("/banqueiro");
  return {};
}

/**
 * Mark all notifications as read for the current banqueiro.
 */
export async function marcarTodasLidas(): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("notifications")
    .update({ lida: true })
    .eq("banqueiro_id", user.id)
    .eq("lida", false);

  if (error) return { error: "Erro ao marcar notificações: " + error.message };

  revalidatePath("/banqueiro");
  return {};
}
