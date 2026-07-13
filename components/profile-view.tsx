"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  MapPin,
  Mail,
  Phone,
  Hash,
  Shield,
  Tag,
  Building2,
  User,
  CheckCircle,
  XCircle,
  CalendarDays,
  Loader2,
} from "lucide-react";

export function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [marketName, setMarketName] = useState<string>("");
  const [leaderName, setLeaderName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!ignore) setError("Não autenticado");
        if (!ignore) setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, markets(nome, provincia)")
        .eq("id", user.id)
        .single();

      if (profileError) {
        if (!ignore) setError("Erro ao carregar perfil: " + profileError.message);
        if (!ignore) setLoading(false);
        return;
      }

      if (!ignore) setProfile(profileData);
      if (!ignore) setMarketName(profileData.markets?.nome ?? "");

      // Carregar nome do líder se for banqueiro e tiver leader_id
      if (profileData.leader_id) {
        const { data: leaderData } = await supabase
          .from("profiles")
          .select("nome")
          .eq("id", profileData.leader_id)
          .single();
        if (!ignore && leaderData) {
          setLeaderName(leaderData.nome);
        }
      }

      if (!ignore) setLoading(false);
    }

    load();
    return () => { ignore = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-bci-muted">
        <Loader2 size={18} className="animate-spin" />
        A carregar perfil...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-bold text-red-600">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  const roleLabel = profile.papel === "chefe" ? "Líder" : "Bankeiro";
  const roleColor = profile.papel === "chefe" ? "bg-bci-blue text-white" : "bg-bci-magenta text-white";

  const infoRows = [
    { label: "Nome completo", value: profile.nome, icon: User },
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Código interno", value: profile.codigo_interno, icon: Hash },
    { label: "Telefone", value: profile.telefone || "—", icon: Phone },
    { label: "Província", value: profile.provincia || "—", icon: MapPin },
    { label: "Mercado local", value: marketName || profile.numero_balcao || "—", icon: Building2 },
    { label: "Nº do Balcão", value: profile.numero_balcao || "—", icon: Tag },
    ...(profile.papel === "banqueiro"
      ? [{ label: "Líder associado", value: leaderName || "—", icon: Shield }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho do perfil */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar / Iniciais */}
          <div className={`h-16 w-16 rounded-2xl ${roleColor} flex items-center justify-center text-xl font-extrabold shadow-md shrink-0`}>
            {profile.nome?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-bci-ink">
                {profile.nome}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-bci-muted">
              {profile.codigo_interno}
            </p>
          </div>
          {/* Status */}
          <div className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
            profile.ativo
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}>
            {profile.ativo ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {profile.ativo ? "Activo" : "Inactivo"}
          </div>
        </div>
      </div>

      {/* Informações detalhadas */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.15em] text-bci-muted mb-5">
          Informações da Conta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {infoRows.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-bci-navySoft flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} className="text-bci-navy" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-bci-muted">
                  {label}
                </p>
                <p className="text-sm font-bold text-bci-ink mt-0.5 break-words">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Data de criação — ocupa linha completa */}
        <div className="mt-6 pt-5 border-t border-bci-line flex items-center gap-3 text-xs text-bci-muted">
          <CalendarDays size={14} />
          <span>
            Conta criada em{" "}
            <strong className="text-bci-ink">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
