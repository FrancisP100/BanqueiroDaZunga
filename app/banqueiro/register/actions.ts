"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function registerProfile(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("papel") ?? "banqueiro");
  const localId = String(formData.get("local_id") ?? "");

  if (!email || !password) {
    return;
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
  });

  const userId = signUpResult.data?.user?.id;
  if (!userId) {
    return;
  }

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

  revalidatePath("/");
  redirect("/login");
}
