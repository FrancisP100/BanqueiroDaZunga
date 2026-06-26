"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function loginUser(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/admin");
  }

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email e senha sao obrigatorios" };
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInResult.error) {
    return { error: signInResult.error.message };
  }

  const userId = signInResult.data?.user?.id;
  if (!userId) {
    return { error: "Nao foi possivel fazer login" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", userId)
    .single();

  revalidatePath("/");

  const role = profile?.papel ?? "admin";
  redirect(`/${role}`);
}
