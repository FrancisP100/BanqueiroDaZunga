import { accounts as mockAccounts, markets as mockMarkets, presences as mockPresences, profiles as mockProfiles, punctualityRule as mockRule } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Account, Market, Presence, Profile, PunctualityRule } from "@/lib/types";

export async function getMvpData() {
  if (!hasSupabaseEnv()) {
    return {
      accounts: mockAccounts,
      markets: mockMarkets,
      presences: mockPresences,
      profiles: mockProfiles,
      punctualityRule: mockRule
    };
  }

  const supabase = await createClient();
  const [profilesResult, marketsResult, accountsResult, presencesResult, settingsResult] = await Promise.all([
    supabase.from("profiles").select("*").order("nome"),
    supabase.from("markets").select("*").order("nome"),
    supabase.from("accounts").select("*, profiles(nome), markets(nome), clientes(*)").order("created_at", { ascending: false }),
    supabase.from("presences").select("*, profiles(nome), markets(nome)").order("data", { ascending: false }),
    supabase.from("punctuality_settings").select("*").eq("id", true).single()
  ]);

  const profiles = (profilesResult.data ?? []).map((row): Profile => ({
    id: row.id,
    email: row.email,
    nome: row.nome,
    codigoInterno: row.codigo_interno,
    papel: row.papel,
    telefone: row.telefone ?? undefined,
    provincia: row.provincia ?? undefined,
    localId: row.local_id ?? undefined,
    numeroBalcao: row.numero_balcao ?? undefined,
    leaderId: row.leader_id ?? undefined,
    ativo: row.ativo,
    deveAlterarSenha: row.force_password_change ?? false
  }));

  const markets = (marketsResult.data ?? []).map((row): Market => ({
    id: row.id,
    nome: row.nome,
    provincia: row.provincia,
    tipo: row.tipo,
    balcao: row.balcao ?? undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    raioMetros: Number(row.raio_metros)
  }));

  const accounts = (accountsResult.data ?? []).map((row): Account => ({
    id: row.id,
    createdAt: row.created_at,
    horaAbertura: row.hora_abertura?.slice(0, 5),
    banqueiroId: row.banqueiro_id,
    banqueiroNome: row.profiles?.nome ?? "",
    clienteId: row.cliente_id ?? `CLI-${row.id.substring(0,4)}`,
    clienteNome: row.clientes?.nome ?? "",
    bi: row.clientes?.bi ?? "",
    biEmissao: row.clientes?.bi_emissao ?? undefined,
    biValidade: row.clientes?.bi_validade ?? undefined,
    telefone: row.clientes?.telefone ?? "",
    celular: row.clientes?.celular ?? undefined,
    endereco: row.clientes?.endereco ?? undefined,
    pacote: row.pacote,
    pacoteStatus: row.pacote_status ?? "ativo",
    tpaStatus: row.tpa_status ?? "sem_tpa",
    mercadoId: row.mercado_id,
    mercadoNome: row.markets?.nome ?? "",
    status: row.status
  }));

  const presences = (presencesResult.data ?? []).map((row): Presence => ({
    id: row.id,
    profileId: row.profile_id,
    nome: row.profiles?.nome ?? "",
    data: row.data,
    entrada: row.entrada?.slice(0, 5),
    saida: row.saida?.slice(0, 5),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    mercadoId: row.mercado_id ?? undefined,
    mercadoNome: row.markets?.nome ?? undefined,
    status: row.status,
    pontualidade: row.pontualidade,
    origem: row.origem,
    observacao: row.observacao ?? undefined,
    updatedAt: row.updated_at ?? undefined
  }));

  const punctualityRule: PunctualityRule = settingsResult.data
    ? {
        horaLimite: String(settingsResult.data.hora_limite).slice(0, 5),
        toleranciaMin: Number(settingsResult.data.tolerancia_min)
      }
    : mockRule;

  return {
    accounts: accounts.length ? accounts : mockAccounts,
    markets: markets.length ? markets : [],
    presences: presences.length ? presences : mockPresences,
    profiles: profiles.length ? profiles : mockProfiles,
    punctualityRule
  };
}
