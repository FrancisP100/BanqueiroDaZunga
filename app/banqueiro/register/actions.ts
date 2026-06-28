"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function registerProfile(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const email        = String(formData.get("email")          ?? "").trim();
  const password     = String(formData.get("password")       ?? "");
  const role         = String(formData.get("papel")          ?? "banqueiro");
  const nome         = String(formData.get("nome")           ?? "").trim();
  const codigoInterno= String(formData.get("codigo_interno") ?? "").trim();
  const telefone     = String(formData.get("telefone")       ?? "").trim();
  const provincia    = String(formData.get("provincia")      ?? "").trim();
  const localIdRaw   = String(formData.get("local_id")       ?? "").trim();
  const localId      = uuidRegex.test(localIdRaw) ? localIdRaw : null;

  // Validações
  if (!email)          return { error: "O email é obrigatório." };
  if (!password)       return { error: "A senha é obrigatória." };
  if (password.length < 6) return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (!nome)           return { error: "O nome é obrigatório." };
  if (!codigoInterno)  return { error: "O código interno é obrigatório." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Admin client (service role) bypassa RLS e confirma email directamente
  // Fallback para anon key se service role não estiver configurada
  const adminClient = serviceKey
    ? createSupabaseClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createClient();

  // Verificar se email já existe em profiles
  const { data: existingEmail } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return { error: "Este email já está registado. Tente fazer login." };
  }

  // Verificar se código interno já existe
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("codigo_interno", codigoInterno)
    .maybeSingle();

  if (existing) {
    return { error: `O código interno "${codigoInterno}" já está em uso.` };
  }

  // Criar utilizador
  let userId: string;

  if (serviceKey) {
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
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
  } else {
    // Fallback com anon key — requer confirmação de email desactivada no Supabase
    const anonClient = await createClient();
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
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
  }

  // Inserir perfil — admin client bypassa RLS
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    email,
    nome,
    codigo_interno: codigoInterno,
    papel: role,
    telefone: telefone || null,
    provincia: provincia || null,
    local_id: localId,
    ativo: true,
  });

  if (profileError) {
    // Limpar utilizador auth para evitar contas órfãs
    if (serviceKey) {
      await (adminClient as ReturnType<typeof createSupabaseClient>)
        .auth.admin.deleteUser(userId).catch(() => {});
    }
    if (profileError.message.includes("duplicate key") && profileError.message.includes("email")) {
      return { error: "Este email já está registado. Tente fazer login." };
    }
    if (profileError.message.includes("duplicate key") && profileError.message.includes("codigo_interno")) {
      return { error: `O código interno "${codigoInterno}" já está em uso.` };
    }
    return { error: "Erro ao guardar o perfil: " + profileError.message };
  }

  redirect("/login");
}
