"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

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
  await supabase.from("accounts").insert({
    banqueiro_id: profile.id,
    cliente_id: clienteId,
    pacote,
    mercado_id: mercadoId || null,
    status: "pendente",
    tpa_status: "pendente",
    hora_abertura: agora.toTimeString().slice(0, 8),
  });

  revalidatePath("/banqueiro");
  revalidatePath("/banqueiro/clientes");
}

/** Só o banqueiro dono da conta pode passar de "pendente" para "aberta" */
export async function ativarConta(accountId: string) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Não autenticado" };

  const { data: account } = await supabase
    .from("accounts")
    .select("id, banqueiro_id, status")
    .eq("id", accountId)
    .single();

  if (!account) return { error: "Conta não encontrada" };
  if (account.banqueiro_id !== auth.user.id)
    return { error: "Só o banqueiro responsável pode activar esta conta" };
  if (account.status === "aberta") return {};

  const { error } = await supabase
    .from("accounts")
    .update({ status: "aberta" })
    .eq("id", accountId);
  if (error) return { error: error.message };

  revalidatePath("/banqueiro/clientes");
  return {};
}

/** Banqueiro actualiza o estado do TPA */
export async function atualizarTpaStatus(
  accountId: string,
  status: "pendente" | "entregue",
) {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ tpa_status: status })
    .eq("id", accountId);
  if (error) return { error: error.message };
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
