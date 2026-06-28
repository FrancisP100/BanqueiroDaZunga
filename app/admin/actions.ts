"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

// Helper: returns an admin-level Supabase client that bypasses RLS
async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  // Fallback to regular server client (works when RLS is disabled in dev)
  return await createClient();
}

export async function createMarket(
  formData: FormData
): Promise<void> {
  if (!hasSupabaseEnv()) return;

  const adminClient = await getAdminClient();

  await adminClient.from("markets").insert({
    nome:        String(formData.get("nome")        ?? ""),
    provincia:   String(formData.get("provincia")   ?? ""),
    tipo:        String(formData.get("tipo")         ?? "mercado"),
    balcao:      String(formData.get("balcao")       ?? "") || null,
    latitude:    Number(formData.get("latitude")),
    longitude:   Number(formData.get("longitude")),
    raio_metros: Number(formData.get("raio_metros") ?? 100),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/mercados");
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function registerProfile(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  if (!hasSupabaseEnv()) return null;

  const email         = String(formData.get("email")          ?? "").trim();
  const password      = String(formData.get("password")       ?? "");
  const role          = String(formData.get("papel")          ?? "banqueiro");
  const nome          = String(formData.get("nome")           ?? "").trim();
  const codigoInterno = String(formData.get("codigo_interno") ?? "").trim();
  const telefone      = String(formData.get("telefone")       ?? "").trim();
  const provincia     = String(formData.get("provincia")      ?? "").trim();
  const localIdRaw    = String(formData.get("local_id")       ?? "").trim();
  const localId       = uuidRegex.test(localIdRaw) ? localIdRaw : null;

  if (!email)               return { error: "O email é obrigatório." };
  if (!password)            return { error: "A senha é obrigatória." };
  if (password.length < 6)  return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (!nome)                return { error: "O nome é obrigatório." };
  if (!codigoInterno)       return { error: "O código interno é obrigatório." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const adminClient = serviceKey
    ? createSupabaseClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createClient();

  // Check for existing email
  const { data: existingEmail } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return { error: "Este email já está registado. Tente fazer login." };
  }

  // Check for existing código interno
  const { data: existingCodigo } = await adminClient
    .from("profiles")
    .select("id")
    .eq("codigo_interno", codigoInterno)
    .maybeSingle();

  if (existingCodigo) {
    return { error: `O código interno "${codigoInterno}" já está em uso.` };
  }

  // Create auth user
  let userId: string;

  if (serviceKey) {
    const { data: userData, error: createError } =
      await (adminClient as ReturnType<typeof createSupabaseClient>)
        .auth.admin.createUser({
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

  // Insert profile
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

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
  return null;
}

export async function updatePunctualityRule(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const adminClient = await getAdminClient();

  await adminClient.from("punctuality_settings").upsert({
    id: true,
    hora_limite:    String(formData.get("hora_limite")    ?? "08:00"),
    tolerancia_min: Number(formData.get("tolerancia_min") ?? 15),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  revalidatePath("/chefe");
}
