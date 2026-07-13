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
    }) as any;
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
  const numeroBalcao  = String(formData.get("numero_balcao")  ?? "").trim();

  const isLider = role === "chefe";

  if (!email)               return { error: "O email é obrigatório." };
  if (!password)            return { error: "A senha é obrigatória." };
  if (password.length < 6)  return { error: "A senha deve ter pelo menos 6 caracteres." };
  if (!nome)                return { error: "O nome é obrigatório." };
  if (!codigoInterno)       return { error: "O código interno é obrigatório." };

  // Líder OBRIGATORIAMENTE precisa de um balcão ou mercado
  if (isLider && !localId && !numeroBalcao) {
    return { error: "O líder precisa de estar associado a um balcão. Preencha o 'Mercado local' ou o 'Número do Balcão'." };
  }

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
      await (adminClient as any)
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
  const isBanqueiro = role === "banqueiro";

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    email,
    nome,
    codigo_interno: codigoInterno,
    papel: role,
    telefone: telefone || null,
    provincia: provincia || null,
    local_id: localId,
    numero_balcao: numeroBalcao || null,
    ativo: true,
    force_password_change: isBanqueiro, // banqueiros trocam senha no 1º login
  });

  if (profileError) {
    if (serviceKey) {
      await (adminClient as any)
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

  // ── Se for líder, sincronizar automaticamente os banqueiros do mesmo balcão ──
  if (isLider && (numeroBalcao || localId)) {
    await syncBanqueirosToLider(adminClient, userId, numeroBalcao, localId);
  }

  // ── Se for banqueiro, vincular automaticamente ao líder do seu balcão ──
  if (isBanqueiro && (numeroBalcao || localId)) {
    await syncLiderToBanqueiro(adminClient, userId, numeroBalcao, localId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
  return null;
}

export async function editProfile(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  if (!hasSupabaseEnv()) return null;

  const profileId    = String(formData.get("id")              ?? "").trim();
  const nome         = String(formData.get("nome")            ?? "").trim();
  const email        = String(formData.get("email")           ?? "").trim();
  const codigoInterno= String(formData.get("codigo_interno")  ?? "").trim();
  const telefone     = String(formData.get("telefone")        ?? "").trim();
  const provincia    = String(formData.get("provincia")       ?? "").trim();
  const localIdRaw   = String(formData.get("local_id")        ?? "").trim();
  const localId      = uuidRegex.test(localIdRaw) ? localIdRaw : null;
  const numeroBalcao = String(formData.get("numero_balcao")   ?? "").trim();

  if (!profileId) return { error: "ID do perfil é obrigatório." };
  if (!nome)      return { error: "O nome é obrigatório." };
  if (!email)     return { error: "O email é obrigatório." };

  const adminClient = await getAdminClient();

  // Verificar se é líder — nesse caso, balcão é obrigatório
  const { data: perfilAtual } = await adminClient
    .from("profiles")
    .select("papel")
    .eq("id", profileId)
    .single();

  if (perfilAtual?.papel === "chefe" && !localId && !numeroBalcao) {
    return { error: "O líder precisa de estar associado a um balcão (Mercado local ou Nº do Balcão)." };
  }

  const { error } = await adminClient
    .from("profiles")
    .update({
      nome,
      email,
      codigo_interno: codigoInterno || undefined,
      telefone: telefone || null,
      provincia: provincia || null,
      local_id: localId,
      numero_balcao: numeroBalcao || null,
    })
    .eq("id", profileId);

  if (error) return { error: "Erro ao actualizar perfil: " + error.message };

  // ── Se editou um líder, ressincronizar os banqueiros ──
  // Primeiro, limpar leader_id dos banqueiros que já não pertencem a este líder
  const adminClient2 = await getAdminClient();
  await adminClient2
    .from("profiles")
    .update({ leader_id: null })
    .eq("leader_id", profileId);

  // Depois, vincular os banqueiros do novo balcão
  if (localId || numeroBalcao) {
    await syncBanqueirosToLider(adminClient2, profileId, numeroBalcao, localId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
  return null;
}

export async function deleteProfile(profileId: string): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const adminClient = await getAdminClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Desvincular banqueiros que apontam para este líder
  await adminClient
    .from("profiles")
    .update({ leader_id: null })
    .eq("leader_id", profileId);

  // 2. Apagar notificações onde o perfil é leader ou destinatário
  await adminClient
    .from("notifications")
    .delete()
    .or(`leader_id.eq.${profileId},banqueiro_id.eq.${profileId}`);

  // 3. Apagar contas associadas ao perfil
  await adminClient
    .from("accounts")
    .delete()
    .eq("banqueiro_id", profileId);

  // 4. Apagar presenças associadas ao perfil
  await adminClient
    .from("presences")
    .delete()
    .eq("profile_id", profileId);

  // 5. Apagar perfil da tabela profiles
  const { error: profileError } = await adminClient
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (profileError) return { error: "Erro ao eliminar perfil: " + profileError.message };

  // 6. Se tiver service role, apagar também o auth user
  if (serviceKey) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const adminAuth = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await (adminAuth as any)
      .auth.admin.deleteUser(profileId).catch(() => {});
  }

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
  return {};
}

export async function toggleProfileStatus(
  profileId: string,
  ativo: boolean
): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const adminClient = await getAdminClient();

  const { error } = await adminClient
    .from("profiles")
    .update({ ativo })
    .eq("id", profileId);

  if (error) return { error: "Erro ao alterar estado: " + error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/banqueiros");
  revalidatePath("/admin/chefes");
  return {};
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

// ─── Admin Notifications ───

/** Fetch all notifications for the admin page */
export async function getAllNotifications(): Promise<{ data?: any[]; error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const adminClient = await getAdminClient();

  const { data, error } = await adminClient
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { error: "Erro ao carregar notificações: " + error.message };
  return { data: data ?? [] };
}

/** Mark a specific notification as read (admin bypasses RLS) */
export async function adminMarcarNotificacaoLida(
  notificationId: string,
): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const adminClient = await getAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({ lida: true })
    .eq("id", notificationId);

  if (error) return { error: "Erro ao marcar notificação: " + error.message };
  return {};
}

/** Mark all notifications as read (admin bypasses RLS) */
export async function adminMarcarTodasLidas(): Promise<{ error?: string }> {
  if (!hasSupabaseEnv()) return { error: "Supabase não configurado" };

  const adminClient = await getAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({ lida: true })
    .eq("lida", false);

  if (error) return { error: "Erro ao marcar notificações: " + error.message };
  return {};
}

// ─── Helpers de sincronização Líder-Banqueiro ───

/**
 * Quando um líder é registado com um número de balcão, actualiza
 * o leader_id de todos os banqueiros desse balcão para apontarem
 * para este líder.
 */
async function syncBanqueirosToLider(
  adminClient: any,
  leaderId: string,
  numeroBalcao: string | null,
  localId: string | null,
) {
  let query = adminClient
    .from("profiles")
    .select("id, nome")
    .eq("papel", "banqueiro");

  if (numeroBalcao) {
    query = query.eq("numero_balcao", numeroBalcao);
  } else if (localId) {
    query = query.eq("local_id", localId);
  } else {
    return;
  }

  const { data: banqueiros, error: queryError } = await query;
  if (queryError) {
    console.error("[AutoSync] Erro ao consultar banqueiros:", queryError);
    return;
  }

  if (!banqueiros || banqueiros.length === 0) {
    console.log(`[AutoSync] Nenhum banqueiro encontrado para vincular ao líder.`);
    return;
  }

  const banqueiroIds = banqueiros.map((b: any) => b.id);

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ leader_id: leaderId })
    .in("id", banqueiroIds);

  if (updateError) {
    console.error("[AutoSync] Erro ao vincular banqueiros:", updateError);
  } else {
    console.log(
      `[AutoSync] Líder vinculado a ${banqueiros.length} banqueiro(s): ${banqueiros.map((b: any) => b.nome).join(", ")}`
    );
  }
}

/**
 * Quando um banqueiro é registado, verifica se já existe um líder
 * para o seu balcão e, se sim, vincula automaticamente.
 */
async function syncLiderToBanqueiro(
  adminClient: any,
  banqueiroId: string,
  numeroBalcao: string | null,
  localId: string | null,
) {
  let query = adminClient
    .from("profiles")
    .select("id, nome")
    .eq("papel", "chefe");

  if (numeroBalcao) {
    query = query.eq("numero_balcao", numeroBalcao);
  } else if (localId) {
    query = query.eq("local_id", localId);
  } else {
    return;
  }

  const { data: lideres, error: queryError } = await query;
  if (queryError || !lideres || lideres.length === 0) return;

  // Se houver múltiplos líderes para o mesmo balcão, usa o primeiro
  const lider = lideres[0];

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ leader_id: lider.id })
    .eq("id", banqueiroId);

  if (!updateError) {
    console.log(`[AutoSync] Banqueiro vinculado ao líder ${lider.nome}`);
  }
}
