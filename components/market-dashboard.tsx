"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Store,
  MapPin,
  Users,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Market } from "@/lib/types";
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";

const CORES_CLASSES: Record<string, string> = {
  Mãezinha: "#e91e63",
  Mãe: "#9c27b0",
  "Mãe Grande": "#3f51b5",
  Mamoite: "#009688",
};

const CORES = ["#e91e63", "#9c27b0", "#3f51b5", "#009688", "#ff5722", "#ff9800"];

type Period = "semana" | "mes" | "3meses" | "ano";

function getPeriodStart(p: Period): Date {
  const now = new Date();
  const d = new Date(now);
  switch (p) {
    case "semana": d.setDate(now.getDate() - 7); break;
    case "mes": d.setMonth(now.getMonth() - 1); break;
    case "3meses": d.setMonth(now.getMonth() - 3); break;
    case "ano": d.setFullYear(now.getFullYear() - 1); break;
  }
  return d;
}

const PERIOD_LABEL: Record<Period, string> = {
  semana: "7 dias",
  mes: "30 dias",
  "3meses": "3 meses",
  ano: "1 ano",
};

export function MarketDashboard({ market }: { market: Market }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("mes");
  const [presenceDate, setPresenceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Dados
  const [stats, setStats] = useState({
    totalBankeiros: 0,
    totalContas: 0,
    contasAbertas: 0,
    contasPendentes: 0,
    tpasEntregues: 0,
    tpasPendentes: 0,
    presencasHoje: 0,
  });
  const [classesData, setClassesData] = useState<any[]>([]);
  const [contasPeriodo, setContasPeriodo] = useState<any[]>([]);
  const [bankeiros, setBankeiros] = useState<
    { id: string; nome: string; contas: number }[]
  >([]);
  const [presences, setPresences] = useState<any[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const mercadoId = market.id;

  // Carregar dados estáticos do mercado
  useEffect(() => {
    async function load() {
      try {
        // Bankeiros deste mercado
        const { data: bankeirosData } = await supabase
          .from("profiles")
          .select("id, nome")
          .eq("papel", "banqueiro")
          .eq("local_id", mercadoId);

        const bankeiroIds = (bankeirosData ?? []).map((b: any) => b.id);

        if (bankeiroIds.length === 0) {
          setLoading(false);
          return;
        }

        // Contas destes bankeiros
        const { data: contasData } = await supabase
          .from("accounts")
          .select("id, status, tpa_status, pacote, created_at, banqueiro_id")
          .in("banqueiro_id", bankeiroIds);

        const contas = contasData ?? [];
        const totalContas = contas.length;

        // Contagem por banqueiro
        const contasPorB: Record<string, number> = {};
        contas.forEach((a: any) => {
          contasPorB[a.banqueiro_id] = (contasPorB[a.banqueiro_id] || 0) + 1;
        });

        setBankeiros(
          (bankeirosData ?? [])
            .map((b: any) => ({
              id: b.id,
              nome: b.nome,
              contas: contasPorB[b.id] || 0,
            }))
            .sort((a: any, b: any) => b.contas - a.contas),
        );

        // Classes
        const classeCount: Record<string, number> = {};
        contas.forEach((a: any) => {
          const p = a.pacote || "Outro";
          classeCount[p] = (classeCount[p] || 0) + 1;
        });
        setClassesData(
          Object.entries(classeCount).map(([nome, valor], i) => ({
            nome,
            valor,
            color: CORES_CLASSES[nome] || CORES[i % CORES.length],
          })),
        );

        // Presenças hoje
        const hoje = new Date().toISOString().split("T")[0];
        const { data: presencasHoje } = await supabase
          .from("presences")
          .select("id")
          .in("profile_id", bankeiroIds)
          .eq("data", hoje);

        setStats({
          totalBankeiros: (bankeirosData ?? []).length,
          totalContas,
          contasAbertas: contas.filter((a: any) => a.status === "aberta").length,
          contasPendentes: contas.filter((a: any) => a.status === "pendente").length,
          tpasEntregues: contas.filter((a: any) => a.tpa_status === "entregue").length,
          tpasPendentes: contas.filter((a: any) => a.tpa_status === "pendente").length,
          presencasHoje: (presencasHoje ?? []).length,
        });
      } catch (err) {
        console.error("Erro ao carregar dados do mercado:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercadoId]);

  // Carregar contas por período
  useEffect(() => {
    async function loadPeriod() {
      const { data: bankeirosData } = await supabase
        .from("profiles")
        .select("id")
        .eq("papel", "banqueiro")
        .eq("local_id", mercadoId);

      const bankeiroIds = (bankeirosData ?? []).map((b: any) => b.id);
      if (bankeiroIds.length === 0) {
        setContasPeriodo([]);
        return;
      }

      const since = getPeriodStart(period).toISOString();
      const { data: periodAccounts } = await supabase
        .from("accounts")
        .select("created_at")
        .in("banqueiro_id", bankeiroIds)
        .gte("created_at", since);

      // Agrupar por dia
      const contasPorDia: Record<string, number> = {};
      const periodStart = getPeriodStart(period);
      const hoje = new Date();
      const diffDays = Math.ceil(
        (Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const numDias = Math.min(diffDays, 365);
      for (let i = numDias - 1; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - i);
        const key = d.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
        });
        contasPorDia[key] = 0;
      }
      (periodAccounts ?? []).forEach((a: any) => {
        const d = new Date(a.created_at);
        const key = d.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
        });
        if (contasPorDia[key] !== undefined) contasPorDia[key]++;
      });
      setContasPeriodo(
        Object.entries(contasPorDia).map(([nome, contas]) => ({ nome, contas })),
      );
    }
    loadPeriod();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercadoId, period]);

  // Carregar presenças para data selecionada
  useEffect(() => {
    async function loadPresences() {
      setPresenceLoading(true);
      try {
        const { data: bankeirosData } = await supabase
          .from("profiles")
          .select("id, nome")
          .eq("papel", "banqueiro")
          .eq("local_id", mercadoId);

        const bankeiroIds = (bankeirosData ?? []).map((b: any) => b.id);
        if (bankeiroIds.length === 0) {
          setPresences([]);
          setPresenceLoading(false);
          return;
        }

        const { data: presencesData } = await supabase
          .from("presences")
          .select(
            "id, profile_id, entrada, saida, status, pontualidade, origem, profiles(nome)",
          )
          .eq("data", presenceDate)
          .in("profile_id", bankeiroIds);

        setPresences(
          (presencesData ?? []).map((row: any) => ({
            id: row.id,
            nome: Array.isArray(row.profiles)
              ? row.profiles[0]?.nome ?? ""
              : row.profiles?.nome ?? "",
            entrada: row.entrada ? String(row.entrada).slice(0, 5) : null,
            saida: row.saida ? String(row.saida).slice(0, 5) : null,
            status: row.status,
            pontualidade: row.pontualidade,
            origem: row.origem,
          })),
        );
      } catch (err) {
        console.error("Erro ao carregar presenças:", err);
      } finally {
        setPresenceLoading(false);
      }
    }
    loadPresences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mercadoId, presenceDate]);

  const periodLabel = PERIOD_LABEL[period];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-bci-muted">
        A carregar dashboard do mercado...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do mercado */}
      <div className="rounded-2xl border border-bci-line bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-bci-navy to-bci-navy2 p-6 sm:p-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/60">
                Dashboard do Mercado
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">
                {market.nome}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {market.provincia}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="capitalize">{market.tipo}</span>
                {market.balcao && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span>Balcão {market.balcao}</span>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/admin/mercados"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white/80 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft size={14} />
              Voltar
            </Link>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-bci-line border-t border-white/10">
          {[
            {
              label: "Bankeiros",
              value: stats.totalBankeiros,
              icon: Users,
              color: "text-bci-magenta",
            },
            {
              label: "Contas Abertas",
              value: stats.contasAbertas,
              icon: CreditCard,
              color: "text-emerald-600",
            },
            {
              label: "TPA's Entregues",
              value: stats.tpasEntregues,
              icon: CheckCircle,
              color: "text-blue-600",
            },
            {
              label: "Presentes Hoje",
              value: stats.presencasHoje,
              icon: Clock,
              color: "text-amber-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 sm:p-5 text-center sm:text-left"
            >
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 ${item.color} mx-auto sm:mx-0 mb-2`}
              >
                <item.icon size={18} />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-bci-ink">
                {item.value}
              </p>
              <p className="text-[10px] font-semibold text-bci-muted uppercase mt-0.5">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de stats secundárias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Contas Pendentes",
            value: stats.contasPendentes,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "TPA's Pendentes",
            value: stats.tpasPendentes,
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Total Contas",
            value: stats.totalContas,
            color: "text-bci-blue bg-blue-50",
          },
          {
            label: "Lat / Lng",
            value: `${market.latitude.toFixed(2)}\u00B0, ${market.longitude.toFixed(2)}\u00B0`,
            color: "text-gray-600 bg-gray-50",
            small: true,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-bci-line bg-white p-4 shadow-card"
          >
            <p className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${item.color} mb-2`}>
              {item.value}
            </p>
            <p className="text-[10px] font-semibold text-bci-muted uppercase tracking-wide">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico de contas por período */}
      <div className="rounded-2xl border border-bci-line bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold text-bci-ink">
            Abertura de Contas ({periodLabel})
          </h3>
          <div className="flex rounded-xl border border-bci-line bg-white p-1 self-start">
            {(["semana", "mes", "3meses", "ano"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  period === p
                    ? "bg-bci-magenta text-white"
                    : "text-gray-500 hover:bg-pink-50"
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 sm:h-56 md:h-64 w-full">
          {contasPeriodo.length === 0 ||
          contasPeriodo.every((d) => d.contas === 0) ? (
            <div className="flex h-full items-center justify-center text-sm text-bci-muted">
              Sem dados de contas para este período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={contasPeriodo}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="contas"
                  name="Contas"
                  stroke="#0f4a8a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0f4a8a" }}
                  activeDot={{ r: 6 }}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Classes + Bankeiros lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Vendidas */}
        <div className="rounded-2xl border border-bci-line bg-white p-4 sm:p-6 shadow-card">
          <h3 className="text-sm font-bold text-bci-ink mb-4">
            Classes Vendidas
          </h3>
          {classesData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-bci-muted">
              Nenhuma classe vendida.
            </div>
          ) : (
            <>
              <div className="h-36 sm:h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="valor"
                      nameKey="nome"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      label={(props: any) =>
                        `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {classesData.map(
                        (entry: { nome: string; color: string }, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Tabela de classes */}
              <div className="mt-4 space-y-1.5">
                {classesData.map((c) => {
                  const total = classesData.reduce(
                    (acc: number, item: any) => acc + item.valor,
                    0,
                  );
                  const pct = total > 0 ? Math.round((c.valor / total) * 100) : 0;
                  return (
                    <div key={c.nome} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-semibold text-bci-ink flex-1">
                        {c.nome}
                      </span>
                      <span className="text-bci-muted">
                        {c.valor} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Top Bankeiros */}
        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-bci-line">
            <h3 className="font-extrabold text-bci-ink text-sm">
              Bankeiros deste Mercado
            </h3>
            <p className="text-xs text-bci-muted mt-0.5">
              {bankeiros.length} atribuídos — ordenados por contas abertas
            </p>
          </div>
          {bankeiros.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">
              Nenhum Bankeiro atribuído a este mercado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Bankeiro</th>
                    <th className="px-4 py-3 text-right">Contas</th>
                  </tr>
                </thead>
                <tbody>
                  {bankeiros.slice(0, 10).map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-t border-bci-line hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-bold text-bci-muted">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-bold">{b.nome}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {b.contas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Presenças */}
      <div className="rounded-2xl border border-bci-line bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
              <Clock size={18} />
            </div>
            <div>
              <p className="font-extrabold text-bci-ink">Presenças</p>
              <p className="text-xs text-bci-muted">
                Registos de presença dos Bankeiros do mercado
              </p>
            </div>
          </div>
          <label className="text-sm font-bold text-bci-ink flex items-center gap-2">
            Data:
            <input
              type="date"
              value={presenceDate}
              onChange={(e) => setPresenceDate(e.target.value)}
              className="rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
            />
          </label>
        </div>

        {presenceLoading ? (
          <p className="py-8 text-center text-sm text-bci-muted">
            A carregar presenças...
          </p>
        ) : presences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-bci-muted">
            <XCircle size={32} className="mb-2 text-bci-muted/50" />
            <p className="text-sm font-semibold">
              Nenhum registo de presença para esta data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-bci-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Bankeiro</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Saída</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pontualidade</th>
                  <th className="px-4 py-3">Origem</th>
                </tr>
              </thead>
              <tbody>
                {presences.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-t border-bci-line hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold">{p.nome}</td>
                    <td className="px-4 py-3">{p.entrada ?? "—"}</td>
                    <td className="px-4 py-3">{p.saida ?? "—"}</td>
                    <td className="px-4 py-3">
                      <PresenceBadge value={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PunctualityBadge value={p.pontualidade} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-bci-muted capitalize">
                        {p.origem}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
