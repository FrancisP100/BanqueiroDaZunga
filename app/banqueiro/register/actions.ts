"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  let userId: string;

  if (serviceKey) {
    // Caminho preferencial: usar admin API com service role
    const adminClient = createSupabaseAdmin(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { papel: role },
    });

    if (createError) {
      if (createError.message.toLowerCase().includes("already")) {
        return { error: "Este email já está registado. Tente fazer login." };
      }
      return { error: "Erro ao criar utilizador: " + createError.message };
    }

    if (!userData?.user?.id) {
      return { error: "Não foi possível obter o ID do utilizador." };
    }

    userId = userData.user.id;

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
      await adminClient.auth.admin.deleteUser(userId).catch(() => {});
      return { error: "Erro ao guardar o perfil: " + profileError.message };
    }
  } else {
    // Fallback: usar signUp com anon key (requer confirmação de email desactivada)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { papel: role } },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already")) {
        return { error: "Este email já está registado. Tente fazer login." };
      }
      return { error: "Erro ao criar utilizador: " + signUpError.message };
    }

    if (!signUpData?.user?.id) {
      return { error: "Não foi possível criar o utilizador. Tente novamente." };
    }

    userId = signUpData.user.id;

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
      return { error: "Erro ao guardar o perfil: " + profileError.message };
    }
  }

  redirect("/login");
}
