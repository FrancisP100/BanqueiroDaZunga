"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { classifyPunctuality, distanceInMeters } from "@/lib/attendance";
import { nowHM, todayISO } from "@/lib/date";

export async function createAccount(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const mercadoId = String(formData.get("mercado_id") ?? "");
  await supabase.from("accounts").insert({
    banqueiro_id: auth.user.id,
    cliente_nome: String(formData.get("cliente_nome") ?? ""),
    bi: String(formData.get("bi") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    pacote: String(formData.get("pacote") ?? ""),
    mercado_id: mercadoId,
    status: "aberta"
  });

  revalidatePath("/banqueiro");
  revalidatePath("/banqueiro/contas");
}

export async function registerPresence(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const mercadoId = String(formData.get("mercado_id") ?? "");
  const entrada = nowHM();

  const [{ data: profile }, { data: market }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", auth.user.id).single(),
    supabase.from("markets").select("id,nome,latitude,longitude,raio_metros").eq("id", mercadoId).single(),
    supabase.from("punctuality_settings").select("hora_limite,tolerancia_min").eq("id", true).single()
  ]);

  if (!market || !settings) return;

  const distance = distanceInMeters(
    { latitude, longitude },
    { latitude: Number(market.latitude), longitude: Number(market.longitude) }
  );
  const status = distance <= Number(market.raio_metros) ? "no_local" : "fora_do_local";
  const pontualidade = classifyPunctuality(entrada, {
    horaLimite: String(settings.hora_limite).slice(0, 5),
    toleranciaMin: Number(settings.tolerancia_min)
  });

  await supabase.from("presences").upsert({
    profile_id: auth.user.id,
    data: todayISO(),
    entrada,
    latitude,
    longitude,
    mercado_id: market.id,
    status,
    pontualidade,
    origem: "gps"
  }, { onConflict: "profile_id,data" });

  revalidatePath("/banqueiro/presenca");
  revalidatePath("/chefe");
}
