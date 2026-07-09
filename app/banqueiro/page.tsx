"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { distanceInMeters } from "@/lib/attendance";
import {
  MapPin,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  LogOut,
  Bell,
  BellOff,
} from "lucide-react";
import { marcarNotificacaoLida } from "@/app/banqueiro/actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

type ReportPeriod = "dia" | "semana" | "mes" | "ano";

function getRangeStart(period: ReportPeriod): Date {
  const now = new Date();
  const d = new Date(now);
  if (period === "dia") d.setDate(now.getDate() - 1);
  else if (period === "semana") d.setDate(now.getDate() - 7);
  else if (period === "mes") d.setMonth(now.getMonth() - 1);
  else if (period === "ano") d.setFullYear(now.getFullYear() - 1);
  return d;
}

export default function BanqueiroDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPacotes: 0,
    tpaEntregues: 0,
    tpaPendentes: 0,
  });
  const [presencaHoje, setPresencaHoje] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("mes");
  const [reportData, setReportData] = useState({
    contasAbertas: 0,
    contasPendentes: 0,
    contasTotal: 0,
    tpaEntregues: 0,
    tpaPendentes: 0,
    clientesUnicos: 0,
    pacotesPorTipo: [] as { nome: string; valor: number }[],
  });
  const [actividadeRecente, setActividadeRecente] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, local_id")
        .eq("id", user.id)
        .single();
      if (!profile) return;

      const { data: accounts } = await supabase
        .from("accounts")
        .select("status, tpa_status")
        .eq("banqueiro_id", profile.id);
      if (accounts) {
        setStats({
          totalPacotes: accounts.length,
          tpaEntregues: accounts.filter((a) => a.tpa_status === "entregue")
            .length,
          tpaPendentes: accounts.filter((a) => a.tpa_status === "pendente")
            .length,
        });
      }

      const hoje = new Date().toISOString().split("T")[0];
      const { data: presenca } = await supabase
        .from("presences")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("data", hoje)
        .single();
      if (presenca) setPresencaHoje(presenca);

      // Carregar notificações
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("banqueiro_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotificacoes(notifs ?? []);

      setLoading(false);
    }
    loadDashboard();

    // Localização em tempo real
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const marcarPresenca = async () => {
    if (!navigator.geolocation) {
      alert("O seu navegador não suporta geolocalização.");
      return;
    }
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSubmitting(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, local_id")
          .eq("id", user.id)
          .single();
        if (!profile) {
          setSubmitting(false);
          return;
        }

        // Validar distância GPS ao mercado
        if (profile.local_id) {
          const { data: market } = await supabase
            .from("markets")
            .select("latitude, longitude, raio_metros")
            .eq("id", profile.local_id)
            .single();

          if (market) {
            const distance = distanceInMeters(
              { latitude, longitude },
              { latitude: market.latitude, longitude: market.longitude }
            );
            const maxRadius = market.raio_metros || 100;

            if (distance > maxRadius) {
              alert(`Fora do raio permitido! Está a ${Math.round(distance)}m do mercado (limite: ${maxRadius}m). Aproxime-se do mercado.`);
              setSubmitting(false);
              return;
            }
          }
        }

        const hoje = new Date().toISOString().split("T")[0];
        const hora = new Date().toTimeString().split(" ")[0];

        const { error } = await supabase.from("presences").insert({
          profile_id: profile.id,
          data: hoje,
          entrada: hora,
          latitude,
          longitude,
          mercado_id: profile.local_id,
          status: "no_local",
          pontualidade: "no_horario",
          origem: "gps",
        });

        if (!error) {
          alert("Presença marcada com sucesso!");
          window.location.reload();
        } else alert("Erro ao marcar presença.");
        setSubmitting(false);
      },
      () => {
        alert("Não foi possível obter a sua localização.");
        setSubmitting(false);
      },
    );
  };

  async function loadReport(profileId: string) {
    setReportLoading(true);
    try {
      const since = getRangeStart(reportPeriod).toISOString();

      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, cliente_id, status, tpa_status, pacote, created_at, hora_abertura, clientes(id, nome, bi)")
        .eq("banqueiro_id", profileId)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      const lista = accounts ?? [];
      const clientesSet = new Set(lista.map((a: any) => a.cliente_id || a.clientes?.id));

      // Contagem por pacote
      const pacoteCount: Record<string, number> = {};
      lista.forEach((a: any) => {
        const p = a.pacote || "Outro";
        pacoteCount[p] = (pacoteCount[p] || 0) + 1;
      });

      setReportData({
        contasAbertas: lista.filter((a: any) => a.status === "aberta").length,
        contasPendentes: lista.filter((a: any) => a.status === "pendente").length,
        contasTotal: lista.length,
        tpaEntregues: lista.filter((a: any) => a.tpa_status === "entregue").length,
        tpaPendentes: lista.filter((a: any) => a.tpa_status === "pendente").length,
        clientesUnicos: clientesSet.size,
        pacotesPorTipo: Object.entries(pacoteCount).map(([nome, valor]) => ({ nome, valor })),
      });

      // Actividade recente (últimas 5)
      setActividadeRecente(lista.slice(0, 5));
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    async function refreshReport() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      if (profile) await loadReport(profile.id);
    }
    refreshReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]);

  const marcarSaida = async () => {
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profile) {
      setSubmitting(false);
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    const hora = new Date().toTimeString().split(" ")[0];

    const { data: presenca } = await supabase
      .from("presences")
      .select("id, saida")
      .eq("profile_id", profile.id)
      .eq("data", hoje)
      .maybeSingle();

    if (!presenca) {
      alert("Registe primeiro a entrada da presença.");
      setSubmitting(false);
      return;
    }

    if (presenca.saida) {
      alert("A saída já foi registada hoje.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("presences")
      .update({ saida: hora, status: "fora_do_local" })
      .eq("id", presenca.id);

    if (!error) {
      alert("Saída registada com sucesso!");
      window.location.reload();
    } else alert("Erro ao marcar saída.");
    setSubmitting(false);
  };

  const tpaData = [
    { name: "Entregues", value: stats.tpaEntregues, color: "#10b981" },
    { name: "Pendentes", value: stats.tpaPendentes, color: "#f59e0b" },
  ];

  const mapsEmbedSrc = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
    : null;

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        A carregar dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bci-dark">Dashboard</h1>
          <p className="text-gray-500">Resumo da sua atividade de hoje</p>
        </div>
        {presencaHoje ? (
          <div className="flex flex-wrap gap-2">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center font-medium">
              <CheckCircle2 className="mr-2" size={20} />
              Entrada {presencaHoje.entrada?.substring(0, 5)}
            </div>
            {presencaHoje.saida ? (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center font-medium">
                <Clock className="mr-2" size={20} />
                Saída {presencaHoje.saida?.substring(0, 5)}
              </div>
            ) : (
              <Button
                onClick={marcarSaida}
                disabled={submitting}
                className="bg-bci-dark hover:bg-bci-dark/90 text-white"
              >
                <LogOut className="mr-2" size={18} />{" "}
                {submitting ? "A guardar..." : "Marcar Saída"}
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={marcarPresenca}
            disabled={submitting}
            className="bg-bci-magenta hover:bg-bci-magenta/90 text-white"
          >
            <MapPin className="mr-2" size={18} />{" "}
            {submitting ? "A guardar..." : "Marcar Presença (GPS)"}
          </Button>
        )}
      </div>

      {/* Localização em tempo real */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            A minha localização agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mapsEmbedSrc ? (
            <iframe
              title="Localização em tempo real"
              src={mapsEmbedSrc}
              className="w-full h-72 rounded-xl border-0"
              loading="lazy"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">
              A obter localização GPS…
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo da atividade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total de Pacotes
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.totalPacotes}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                TPA's Entregues
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.tpaEntregues}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                TPA's Pendentes
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.tpaPendentes}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            TPA's pendentes e entregues
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {stats.totalPacotes > 0 ? (
            <div className="h-full min-h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tpaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tpaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relatório Consolidado */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Relatório Total
              </CardTitle>
              <p className="text-sm text-gray-500">Resumo completo do seu trabalho</p>
            </div>
            <div className="flex rounded-xl border border-bci-line bg-white p-1">
              {(["dia", "semana", "mes", "ano"] as ReportPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    reportPeriod === p
                      ? "bg-bci-magenta text-white"
                      : "text-gray-500 hover:bg-pink-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {reportLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              A carregar relatório...
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Contas Abertas", value: reportData.contasAbertas, color: "bg-emerald-100 text-emerald-600" },
                  { label: "Pendentes", value: reportData.contasPendentes, color: "bg-amber-100 text-amber-600" },
                  { label: "Total Contas", value: reportData.contasTotal, color: "bg-blue-100 text-blue-600" },
                  { label: "TPA Entregues", value: reportData.tpaEntregues, color: "bg-emerald-100 text-emerald-600" },
                  { label: "TPA Pendentes", value: reportData.tpaPendentes, color: "bg-orange-100 text-orange-600" },
                  { label: "Clientes", value: reportData.clientesUnicos, color: "bg-purple-100 text-purple-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-bci-line bg-gray-50/50 p-3 text-center">
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color} text-xs font-bold mb-1`}>
                      {value}
                    </div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>

              {/* Pacotes vendidos + Gráfico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pacotes por tipo */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Pacotes Vendidos</h4>
                  {reportData.pacotesPorTipo.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Nenhum pacote vendido neste período.</p>
                  ) : (
                    <div className="space-y-2">
                      {reportData.pacotesPorTipo.map((p) => {
                        const total = reportData.contasTotal || 1;
                        const percent = Math.round((p.valor / total) * 100);
                        return (
                          <div key={p.nome}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-gray-700">{p.nome}</span>
                              <span className="text-gray-500">{p.valor} ({percent}%)</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-bci-magenta transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mini bar chart */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Contas Abertas vs Pendentes</h4>
                  {reportData.contasTotal === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Sem dados para este período.</p>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { nome: "Abertas", valor: reportData.contasAbertas },
                            { nome: "Pendentes", valor: reportData.contasPendentes },
                            { nome: "TPA Entregues", valor: reportData.tpaEntregues },
                            { nome: "TPA Pendentes", valor: reportData.tpaPendentes },
                          ]}
                          margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="valor" fill="#e91e63" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Actividade Recente */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Actividade Recente</h4>
                {actividadeRecente.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Nenhuma actividade neste período.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-bci-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2.5">Cliente</th>
                          <th className="px-3 py-2.5">BI</th>
                          <th className="px-3 py-2.5">Pacote</th>
                          <th className="px-3 py-2.5">Estado</th>
                          <th className="px-3 py-2.5">TPA</th>
                          <th className="px-3 py-2.5">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actividadeRecente.map((a: any) => (
                          <tr key={a.id} className="border-t border-bci-line hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 font-semibold">{a.clientes?.nome ?? "---"}</td>
                            <td className="px-3 py-2.5 text-gray-500">{a.clientes?.bi ?? "---"}</td>
                            <td className="px-3 py-2.5">{a.pacote}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                a.status === "aberta" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                a.tpa_status === "entregue" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {a.tpa_status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                              {new Date(a.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificações do Líder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bell size={20} className="text-bci-magenta" />
              Notificações do Líder
            </CardTitle>
            {notificacoes.filter((n) => !n.lida).length > 0 && (
              <span className="rounded-full bg-bci-magenta px-2.5 py-0.5 text-xs font-bold text-white">
                {notificacoes.filter((n) => !n.lida).length} nova{notificacoes.filter((n) => !n.lida).length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Alertas enviados pelo seu líder sobre TPAs pendentes</p>
        </CardHeader>
        <CardContent>
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <BellOff size={32} className="mb-2" />
              <p className="text-sm">Sem notificações</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notificacoes.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    n.lida
                      ? 'border-bci-line bg-white'
                      : 'border-bci-magenta/30 bg-bci-magenta/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className={`text-sm ${n.lida ? 'text-gray-600' : 'font-bold text-gray-900'}`}>
                        {n.mensagem}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    {!n.lida && (
                      <button
                        onClick={async () => {
                          await marcarNotificacaoLida(n.id);
                          setNotificacoes((prev: any[]) =>
                            prev.map((notif: any) =>
                              notif.id === n.id ? { ...notif, lida: true } : notif,
                            ),
                          );
                        }}
                        className="shrink-0 rounded-lg bg-bci-magenta/10 px-2.5 py-1 text-xs font-bold text-bci-magenta hover:bg-bci-magenta hover:text-white transition-colors"
                      >
                        Marcar lida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
