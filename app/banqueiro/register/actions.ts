"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function registerProfile(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("papel") ?? "banqueiro");
  const nome = String(formData.get("nome") ?? "").trim();
  const codigoInterno = String(formData.get("codigo_interno") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const provincia = String(formData.get("provincia") ?? "").trim();
  const localId = String(formData.get("local_id") ?? "").trim();

  // Validações básicas
  if (!email) return { error: "O email é obrigatório." };
  if (!password) return { error: "A senha é obrigatória." };
  if (password.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (!nome) return { error: "O nome é obrigatório." };
  if (!codigoInterno) return { error: "O código interno é obrigatório." };

  // Verificar se código interno já existe
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("codigo_interno", codigoInterno)
    .maybeSingle();

  if (existing) {
    return { error: `O código interno "${codigoInterno}" já está em uso.` };
  }

  // Criar utilizador no Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { papel: role },
    },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      return { error: "Este email já está registado. Tente fazer login." };
    }
    return { error: signUpError.message };
  }

  const userId = signUpData?.user?.id;
  if (!userId) {
    return { error: "Não foi possível criar o utilizador. Tente novamente." };
  }

  // Inserir perfil
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email,
    nome,
    codigo_interno: codigoInterno,
    papel: role,
    telefone: telefone || null,
    provincia: provincia || null,
    local_id: localId || null,
    ativo: true,
  });

  if (profileError) {
    // Limpar o utilizador auth criado para evitar contas órfãs
    await supabase.auth.admin?.deleteUser(userId).catch(() => {});
    return { error: "Erro ao guardar o perfil: " + profileError.message };
  }

  redirect("/login");
}
