"use client";

import { useEffect, useState, useActionState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from "lucide-react";
import { editProfile } from "@/app/admin/actions";

export default function EditarPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(editProfile, null);
  const hasSubmitted = useRef(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setError("ID inválido.");
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("*, markets(nome, provincia)")
      .eq("id", id)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError("Erro ao carregar perfil: " + err.message);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [id, supabase]);

  // Redirecionar apenas APÓS submissão bem-sucedida (não no carregamento inicial)
  useEffect(() => {
    if (hasSubmitted.current && !pending && !state && profile) {
      router.push("/admin");
    }
  }, [state, pending, profile, router]);

  if (loading) {
    return (
      <div className="py-20 text-center text-bci-muted">
        A carregar dados do perfil...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-20 text-center text-red-600">
        {error || "Perfil não encontrado."}
        <br />
        <Link href="/admin" className="mt-4 inline-block text-bci-blue underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-navy transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao painel
      </Link>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Administração
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Editar Perfil
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          A editar: <strong>{profile.nome}</strong> ({profile.codigo_interno})
        </p>
      </div>

      <form
        action={formAction}
        className="grid gap-4 rounded-2xl border border-bci-line bg-white p-6 shadow-card md:grid-cols-2"
      >
        <input type="hidden" name="id" value={profile.id} />

        {state?.error && (
          <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}

        <label className="text-sm font-bold text-bci-ink md:col-span-2">
          Dados do perfil
          <p className="mt-1 text-xs font-medium text-bci-muted">
            Preencha os campos que deseja actualizar.
          </p>
        </label>

        <label className="text-sm font-bold text-bci-ink">
          Nome completo
          <input
            name="nome"
            defaultValue={profile.nome}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>
        <label className="text-sm font-bold text-bci-ink">
          Email
          <input
            name="email"
            type="email"
            defaultValue={profile.email}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>
        <label className="text-sm font-bold text-bci-ink">
          Código interno
          <input
            name="codigo_interno"
            defaultValue={profile.codigo_interno}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>
        <label className="text-sm font-bold text-bci-ink">
          Telefone
          <input
            name="telefone"
            defaultValue={profile.telefone ?? ""}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>
        <label className="text-sm font-bold text-bci-ink">
          Província
          <input
            name="provincia"
            defaultValue={profile.provincia ?? ""}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>
        <label className="text-sm font-bold text-bci-ink">
          Número do Balcão
          <input
            name="numero_balcao"
            defaultValue={profile.numero_balcao ?? ""}
            className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </label>

        <div className="md:col-span-2 flex justify-end gap-3 pt-4">
          <Link
            href="/admin"
            className="rounded-xl border border-bci-line px-5 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            onClick={() => { hasSubmitted.current = true; }}
            className="inline-flex items-center gap-2 rounded-xl bg-bci-navy px-6 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors disabled:opacity-60"
          >
            <Save size={18} />
            {pending ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
