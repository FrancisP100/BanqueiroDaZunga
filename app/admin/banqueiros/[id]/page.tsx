"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBrowserClient } from '@/lib/supabase/client';
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";
import { ArrowLeft, CreditCard, MapPin, Phone, Calendar, Building } from "lucide-react";

export default function AdminInspecionarBanqueiro() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [banqueiro, setBanqueiro] = useState<any>(null);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ), []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!id || typeof id !== "string") {
        if (!ignore) setError("ID inválido.");
        if (!ignore) setLoading(false);
        return;
      }

      try {
        if (!ignore) setLoading(true);
        if (!ignore) setError(null);

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
              "id, pacote, status, tpa_status, created_at, hora_abertura, clientes(nome, bi)",
            )
            .eq("banqueiro_id", id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileRes.error) throw profileRes.error;

        if (!ignore) {
          setBanqueiro(profileRes.data);
          setPresencas(presRes.data ?? []);
          setContas(accsRes.data ?? []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Erro ao carregar banqueiro:", err);
          setError(err instanceof Error ? err.message : "Falha ao carregar os dados.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => { ignore = true; };
  }, [id, supabase, refreshKey]);

  if (loading) {
    return (
      <div className="py-20 text-center text-bci-muted">
        A carregar dados do Bankeiro...
      </div>
    );
  }

  if (error || !banqueiro) {
    return (
      <div className="py-20 text-center text-red-600">
        {error || "Bankeiro não encontrado."}
        <br />
        <Link
          href="/admin/banqueiros"
          className="mt-4 inline-block text-bci-magenta underline"
        >
          Voltar à lista
        </Link>
        <button onClick={() => setRefreshKey(k => k + 1)} className="mt-4 ml-4 underline text-bci-magenta">
          Tentar novamente
        </button>
      </div>
    );
  }

  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;
  const totalClientes = contas.filter((c) => c.clientes?.nome).length;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/banqueiros"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-magenta transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar à lista
      </Link>

      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-magenta/70">
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
          {banqueiro.numero_balcao && (
            <span className="flex items-center gap-1.5">
              <Building size={14} /> Balcão: {banqueiro.numero_balcao}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contas Abertas", value: contasAbertas },
          { label: "Contas Pendentes", value: contasPendentes },
          { label: "TPA's Entregues", value: tpaEntregues },
          { label: "Total de Clientes", value: totalClientes },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-bci-line bg-white p-5 shadow-card"
          >
            <p className="text-2xl font-extrabold text-bci-ink">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center gap-2">
          <Calendar size={16} className="text-bci-magenta" />
          <h2 className="font-extrabold text-bci-ink">
            Histórico de presenças (últimos 30 registos)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3">Saída</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pontualidade</th>
              </tr>
            </thead>
            <tbody>
              {presencas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-bci-muted">
                    Sem registos de presença.
                  </td>
                </tr>
              ) : (
                presencas.map((p) => (
                  <tr key={p.id} className="border-t border-bci-line">
                    <td className="px-4 py-3 font-bold">{p.data}</td>
                    <td className="px-4 py-3">
                      {p.entrada ? String(p.entrada).slice(0, 5) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.saida ? String(p.saida).slice(0, 5) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PresenceBadge value={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PunctualityBadge value={p.pontualidade} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line">
          <h2 className="font-extrabold text-bci-ink">Clientes cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">BI</th>
                <th className="px-4 py-3">Pacote</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">TPA</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {contas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-bci-muted">
                    Sem clientes cadastrados.
                  </td>
                </tr>
              ) : (
                contas.map((c) => (
                  <tr key={c.id} className="border-t border-bci-line">
                    <td className="px-4 py-3 font-bold">{c.clientes?.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">{c.clientes?.bi}</td>
                    <td className="px-4 py-3">{c.pacote}</td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                    <td className="px-4 py-3 capitalize">{c.tpa_status}</td>
                    <td className="px-4 py-3 text-bci-muted">
                      {new Date(c.created_at).toLocaleDateString()}{" "}
                      {c.hora_abertura ? String(c.hora_abertura).slice(0, 5) : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
