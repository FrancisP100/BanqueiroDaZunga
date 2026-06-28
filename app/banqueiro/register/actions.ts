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
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("papel") ?? "banqueiro");
  const localId = String(formData.get("local_id") ?? "");

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres" };
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Não enviar email de confirmação — o admin regista directamente
      data: { papel: role },
    },
  });

  if (signUpResult.error) {
    return { error: signUpResult.error.message };
  }

  const userId = signUpResult.data?.user?.id;
  if (!userId) {
    return { error: "Não foi possível criar o utilizador" };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
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

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/");
  redirect("/login");
}
