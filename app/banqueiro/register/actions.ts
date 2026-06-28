"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function registerProfile(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("papel") ?? "banqueiro");
  const nome = String(formData.get("nome") ?? "").trim();
  const codigoInterno = String(formData.get("codigo_interno") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const provincia = String(formData.get("provincia") ?? "").trim();
  const localId = String(formData.get("local_id") ?? "").trim();

  // Validações
  if (!email) return { error: "O email é obrigatório." };
  if (!password) return { error: "A senha é obrigatória." };
  if (password.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (!nome) return { error: "O nome é obrigatório." };
  if (!codigoInterno) return { error: "O código interno é obrigatório." };

  const supabase = await createClient();

  // Verificar se código interno já existe
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("codigo_interno", codigoInterno)
    .maybeSingle();

  if (existing) {
    return { error: `O código interno "${codigoInterno}" já está em uso.` };
  }

  // Usar admin client para criar utilizador — mais robusto que signUp com anon key
  const adminClient = createAdminClient();

  const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmar directamente sem email
    user_metadata: { papel: role },
  });

  if (createError) {
    if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
      return { error: "Este email já está registado. Tente fazer login." };
    }
    return { error: "Erro ao criar utilizador: " + createError.message };
  }

  const userId = userData?.user?.id;
  if (!userId) {
    return { error: "Não foi possível obter o ID do utilizador criado." };
  }

  // Inserir perfil na tabela profiles
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
    // Limpar utilizador auth para evitar contas órfãs
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    return { error: "Erro ao guardar o perfil: " + profileError.message };
  }

  redirect("/login");
}
