"use client";

import { useEffect, useState } from "react";
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
  const [clientes, setClientes] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function load() {
      try {
        if (!id) {
          setBanqueiro(null);
          setLoading(false);
          return;
        }

        const [{ data: profile, error: profileError }, { data: pres, error: presError }, { data: accs, error: accsError }] = await Promise.all([
          supabase.from("profiles").select("*, markets(nome, provincia)").eq("id", id).single(),
          supabase.from("presences").select("*").eq("profile_id", id).order("data", { ascending: false }).limit(30),
          supabase.from("accounts").select("id, pacote, status, tpa_status, created_at, hora_abertura, clientes(nome, bi)").eq("banqueiro_id", id).order("created_at", { ascending: false }),
        ]);

        if (profileError) {
          console.error("Erro ao carregar banqueiro", profileError);
        }
        if (presError) {
          console.error("Erro ao carregar presenças", presError);
        }
        if (accsError) {
          console.error("Erro ao carregar contas", accsError);
        }

        setBanqueiro(profile ?? null);
        setPresencas(pres ?? []);
        setContas(accs ?? []);
        setClientes((accs ?? []).map((a: any) => a.clientes).filter(Boolean));
      } catch (error) {
        console.error("Erro inesperado ao carregar inspeção do banqueiro", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading)
    return (
      <div className="py-20 text-center text-bci-muted">A carregar...</div>
    );
  if (!banqueiro)
    return (
      <div className="py-20 text-center text-bci-muted">
        Bankeiro não encontrado.
      </div>
    );

  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contas Abertas", value: contasAbertas },
          { label: "Contas Pendentes", value: contasPendentes },
          { label: "TPA's Entregues", value: tpaEntregues },
          { label: "Total de Clientes", value: clientes.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-bci-line bg-white p-5 shadow-card"
          >
            <p className="text-2xl font-extrabold text-bci-ink">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center gap-2">
          <Calendar size={16} className="text-bci-blue" />
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
              {presencas.map((p) => (
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
              ))}
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
              {contas.map((c) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
