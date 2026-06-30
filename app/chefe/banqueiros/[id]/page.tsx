"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";
import { CreditCard, MapPin, Phone, Calendar } from "lucide-react";

export default function InspecionarBanqueiro() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [banqueiro, setBanqueiro] = useState<any>(null);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    if (!id) {
      setError("ID do banqueiro não encontrado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileRes, presRes, accsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, markets(nome, provincia)")
          .eq("id", id)
          .single(),

        supabase
          .from("presences")
          .select("*")
          .eq("profile_id", id)
          .order("data", { ascending: false })
          .limit(30),

        supabase
          .from("accounts")
          .select(
            "id, pacote, status, tpa_status, created_at, hora_abertura, clientes(nome, bi)"
          )
          .eq("banqueiro_id", id)
          .order("created_at", { ascending: false }),
      ]);

      // Tratamento de erros individual
      if (profileRes.error) {
        console.error("Erro profile:", profileRes.error);
        throw new Error("Não foi possível carregar o perfil do banqueiro.");
      }

      setBanqueiro(profileRes.data);
      setPresencas(presRes.data ?? []);
      setContas(accsRes.data ?? []);

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Erro inesperado ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ====================== UI ======================
  if (loading) {
    return (
      <div className="py-20 text-center text-bci-muted">
        A carregar dados do banqueiro...
      </div>
    );
  }

  if (error || !banqueiro) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">{error || "Bankeiro não encontrado."}</p>
        <button
          onClick={loadData}
          className="mt-4 text-bci-blue hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;
  const totalClientes = contas.filter((c) => c.clientes).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
          Inspecção de Bankeiro
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          {banqueiro.nome}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-bci-muted">
          <span className="flex items-center gap-1.5">
            <CreditCard size={14} /> {banqueiro.codigo_interno}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone size={14} /> {banqueiro.telefone ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} /> {banqueiro.markets?.nome ?? "—"} ·{" "}
            {banqueiro.provincia}
          </span>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contas Abertas", value: contasAbertas },
          { label: "Contas Pendentes", value: contasPendentes },
          { label: "TPA's Entregues", value: tpaEntregues },
          { label: "Total de Clientes", value: totalClientes },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <p className="text-2xl font-extrabold text-bci-ink">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Presenças e Clientes (mantive igual ao teu código, só melhorei um pouco) */}
      {/* ... (o resto do return fica igual ao que tinhas, podes colar o teu código das tabelas aqui) */}
    </div>
  );
}