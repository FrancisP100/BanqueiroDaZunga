"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function createMarket(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  await supabase.from("markets").insert({
    nome: String(formData.get("nome") ?? ""),
    provincia: String(formData.get("provincia") ?? ""),
    tipo: String(formData.get("tipo") ?? "mercado"),
    balcao: String(formData.get("balcao") ?? ""),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    raio_metros: Number(formData.get("raio_metros") ?? 100),
  });

  revalidatePath("/admin");
}

export async function registerProfile(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("papel") ?? "banqueiro");
  const localId = String(formData.get("local_id") ?? "");

  if (!email || !password) return;

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
  });

  const userId = signUpResult.data?.user?.id;
  if (!userId) return;

  await supabase.from("profiles").insert({
    id: userId,
    email,
    nome: String(formData.get("nome") ?? ""),
    codigo_interno: String(formData.get("codigo_interno") ?? ""),
    papel: role,
    telefone: String(formData.get("telefone") ?? ""),
    provincia: String(formData.get("provincia") ?? ""),
    local_id: localId || null,
    ativo: true,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
}

export async function updatePunctualityRule(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  await supabase.from("punctuality_settings").upsert({
    id: true,
    hora_limite: String(formData.get("hora_limite") ?? "08:00"),
    tolerancia_min: Number(formData.get("tolerancia_min") ?? 15),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  revalidatePath("/chefe");
}
