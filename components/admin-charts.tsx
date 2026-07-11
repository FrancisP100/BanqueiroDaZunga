'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
  Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Users, Store, Building2, MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ReportPeriod } from '@/lib/types';
import { PresenceBadge, PunctualityBadge } from '@/components/ui/status-badge';

interface StatsData {
  totalBanqueiros: number;
  totalLideres: number;
  totalMercados: number;
  totalContas: number;
  contasAbertas: number;
  contasPendentes: number;
  tpasEntregues: number;
  tpasPendentes: number;
  presencasHoje: number;
  faltasHoje: number;
}

interface ProvinciaData {
  provincia: string;
  mercados: number;
  banqueiros: number;
  contas: number;
}

export function AdminCharts() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [selectedProvincia, setSelectedProvincia] = useState<string>('todas');
  const [selectedMercado, setSelectedMercado] = useState<string>('todos');
  const [selectedBalcao, setSelectedBalcao] = useState<string>('todos');
  const [mercados, setMercados] = useState<any[]>([]);
  const [balcoes, setBalcoes] = useState<any[]>([]);

  // Período selecionado
  const [period, setPeriod] = useState<ReportPeriod>('semana');

  // Presença monitoramento
  const [presenceDate, setPresenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [presenceList, setPresenceList] = useState<any[]>([]);
  const [noRecordList, setNoRecordList] = useState<any[]>([]);
  const [presenceStats, setPresenceStats] = useState({ presentes: 0, atrasos: 0, faltas: 0 });
  const [presenceLoading, setPresenceLoading] = useState(false);

  // Dados detalhados por filtro
  const [contasPeriodo, setContasPeriodo] = useState<any[]>([]);
  const [porProvincia, setPorProvincia] = useState<ProvinciaData[]>([]);
  const [porMercado, setPorMercado] = useState<any[]>([]);
  const [porBanqueiro, setPorBanqueiro] = useState<any[]>([]);
  const [porLider, setPorLider] = useState<any[]>([]);
  const [pacotesData, setPacotesData] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Carregar dados principais uma vez (estáticas que não dependem de filtros)
  useEffect(() => {
    async function loadInitial() {
      try {
        const [profilesRes, marketsRes, accountsRes, presencesRes] = await Promise.all([
          supabase.from('profiles').select('papel, provincia, local_id'),
          supabase.from('markets').select('id, nome, provincia, balcao'),
          supabase.from('accounts').select('status, tpa_status'),
          supabase.from('presences').select('status').eq('data', new Date().toISOString().split('T')[0]),
        ]);

        const banqueiros = (profilesRes.data ?? []).filter((p: any) => p.papel === 'banqueiro');
        const lideres = (profilesRes.data ?? []).filter((p: any) => p.papel === 'chefe');
        const contas = accountsRes.data ?? [];

        setStats({
          totalBanqueiros: banqueiros.length,
          totalLideres: lideres.length,
          totalMercados: (marketsRes.data ?? []).length,
          totalContas: contas.length,
          contasAbertas: contas.filter((a: any) => a.status === 'aberta').length,
          contasPendentes: contas.filter((a: any) => a.status === 'pendente').length,
          tpasEntregues: contas.filter((a: any) => a.tpa_status === 'entregue').length,
          tpasPendentes: contas.filter((a: any) => a.tpa_status === 'pendente').length,
          presencasHoje: presencesRes.data?.filter((p: any) => p.status === 'no_local').length ?? 0,
          faltasHoje: presencesRes.data?.filter((p: any) => p.status === 'falta').length ?? 0,
        });

        const mercadosList = marketsRes.data ?? [];
        setMercados(mercadosList);

        const provinciasSet = new Set(mercadosList.map((m: any) => m.provincia));
        setProvincias(Array.from(provinciasSet).sort() as string[]);

      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper para calcular o início do período
  function getPeriodStart(p: ReportPeriod): Date {
    const now = new Date();
    const d = new Date(now);
    switch (p) {
      case 'dia': d.setDate(now.getDate() - 1); break;
      case 'semana': d.setDate(now.getDate() - 7); break;
      case 'mes': d.setMonth(now.getMonth() - 1); break;
      case '3meses': d.setMonth(now.getMonth() - 3); break;
      case '6meses': d.setMonth(now.getMonth() - 6); break;
      case 'ano': d.setFullYear(now.getFullYear() - 1); break;
    }
    return d;
  }

  // Labels para exibição
  const periodLabel: Record<ReportPeriod, string> = {
    dia: 'Hoje',
    semana: '7 dias',
    mes: '30 dias',
    '3meses': '3 meses',
    '6meses': '6 meses',
    ano: '1 ano',
  };

  useEffect(() => {
    async function loadFiltered() {
      setLoading(true);

      try {
        const marketsAll = mercados;
        const prov = selectedProvincia !== 'todas' ? selectedProvincia : null;
        const mkt = selectedMercado !== 'todos' ? selectedMercado : null;

        let mercadosFiltrados = marketsAll;
        if (prov) mercadosFiltrados = mercadosFiltrados.filter((m: any) => m.provincia === prov);
        if (mkt) mercadosFiltrados = mercadosFiltrados.filter((m: any) => m.id === mkt);

        const mercadoIds = mercadosFiltrados.map((m: any) => m.id);

        if (mercadoIds.length === 0) {
          setPorProvincia([]);
          setPorBanqueiro([]);
          setPorLider([]);
          setPacotesData([]);
          setContasPeriodo([]);
          setLoading(false);
          return;
        }

        const { data: accsFiltradas } = await supabase
          .from('accounts')
          .select('id, status, tpa_status, pacote, created_at, mercado_id, banqueiro_id')
          .in('mercado_id', mercadoIds);

        const contasFiltradas = accsFiltradas ?? [];

        // Pacotes
        const pacoteCount: Record<string, number> = {};
        contasFiltradas.forEach((a: any) => {
          const p = a.pacote || 'Outro';
          pacoteCount[p] = (pacoteCount[p] || 0) + 1;
        });
        const cores = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff5722'];
        setPacotesData(
          Object.entries(pacoteCount).map(([nome, valor], i) => ({ nome, valor, color: cores[i % cores.length] }))
        );

        // Contas por provincia
        const contasPorP: Record<string, number> = {};
        mercadosFiltrados.forEach((m: any) => {
          const count = contasFiltradas.filter((a: any) => a.mercado_id === m.id).length;
          contasPorP[m.provincia] = (contasPorP[m.provincia] || 0) + count;
        });

        const provinciasFiltradas = Array.from(new Set(mercadosFiltrados.map((m: any) => m.provincia))).sort();
        setPorProvincia(
          provinciasFiltradas.map((p) => ({
            provincia: p,
            mercados: mercadosFiltrados.filter((m: any) => m.provincia === p).length,
            banqueiros: 0,
            contas: contasPorP[p] || 0,
          }))
        );

        // Contas por período
        const periodStart = getPeriodStart(period);
        const since = periodStart.toISOString();

        const { data: periodAccounts } = await supabase
          .from('accounts')
          .select('created_at, mercado_id')
          .gte('created_at', since)
          .in('mercado_id', mercadoIds);

        const contasPorDia: Record<string, number> = {};
        const hoje = new Date();
        const diffDays = Math.ceil((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        const numDias = Math.min(diffDays, 365);
        for (let i = numDias - 1; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(hoje.getDate() - i);
          const key = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
          contasPorDia[key] = 0;
        }
        (periodAccounts ?? []).forEach((a: { created_at: string }) => {
          const d = new Date(a.created_at);
          const key = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
          if (contasPorDia[key] !== undefined) contasPorDia[key]++;
        });
        setContasPeriodo(
          Object.entries(contasPorDia).map(([nome, contas]) => ({ nome, contas }))
        );

        // Top banqueiros
        const contasPorB: Record<string, number> = {};
        contasFiltradas.forEach((a: any) => {
          const bid = a.banqueiro_id;
          contasPorB[bid] = (contasPorB[bid] || 0) + 1;
        });

        const topIds = Object.entries(contasPorB)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id]) => id);

        if (topIds.length > 0) {
          const { data: topProfiles } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', topIds);

          setPorBanqueiro(
            topIds.map((id) => ({
              nome: (topProfiles ?? []).find((p: any) => p.id === id)?.nome || '—',
              contas: contasPorB[id],
            }))
          );
        } else {
          setPorBanqueiro([]);
        }

        // Líderes vinculados a estes mercados
        const { data: liderProfiles } = await supabase
          .from('profiles')
          .select('id, nome, local_id')
          .eq('papel', 'chefe')
          .in('local_id', mercadoIds);

        setPorLider(
          (liderProfiles ?? []).map((l: any) => ({
            nome: l.nome,
            mercado: mercadosFiltrados.find((m: any) => m.id === l.local_id)?.nome || '—',
          }))
        );

      } catch (err) {
        console.error('Erro ao carregar dados filtrados:', err);
      } finally {
        setLoading(false);
      }
    }

    // Só carrega dados filtrados se já tivermos mercados carregados
    // (após loadInitial() terminar, o mercados.length >= 1 se houver mercados na BD)
    if (mercados.length > 0) {
      loadFiltered();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvincia, selectedMercado, selectedBalcao, mercados.length, period]);

  // Carregar dados de presença para a data selecionada
  useEffect(() => {
    async function loadPresences() {
      setPresenceLoading(true);

      try {
        const [profilesRes, presencesRes, marketsRes] = await Promise.all([
          supabase.from('profiles').select('id, nome, local_id').eq('papel', 'banqueiro'),
          supabase.from('presences')
            .select('id, profile_id, entrada, saida, status, pontualidade, origem, profiles(nome), markets(nome)')
            .eq('data', presenceDate),
          supabase.from('markets').select('id, nome'),
        ]);

        const banqueiros = (profilesRes.data ?? []).map((b: any) => ({
          id: b.id,
          nome: b.nome,
          mercadoNome: marketsRes.data?.find((m: any) => m.id === b.local_id)?.nome || '—',
        }));

        const presences = (presencesRes.data ?? []).map((row: any) => ({
          id: row.id,
          profileId: row.profile_id,
          nome: Array.isArray(row.profiles) ? (row.profiles[0]?.nome ?? '') : (row.profiles?.nome ?? ''),
          mercadoNome: Array.isArray(row.markets) ? (row.markets[0]?.nome ?? '-') : (row.markets?.nome ?? '-'),
          entrada: row.entrada ? String(row.entrada).slice(0, 5) : null,
          saida: row.saida ? String(row.saida).slice(0, 5) : null,
          status: row.status,
          pontualidade: row.pontualidade,
          origem: row.origem,
        }));

        setPresenceList(presences);

        const presenceProfileIds = new Set(presences.map((p: any) => p.profileId));
        const semRegisto = banqueiros.filter((b: any) => !presenceProfileIds.has(b.id));
        setNoRecordList(semRegisto);

        setPresenceStats({
          presentes: presences.filter((p: any) => p.status === 'no_local').length,
          atrasos: presences.filter((p: any) => p.pontualidade === 'atraso').length,
          faltas: presences.filter((p: any) => p.status === 'falta').length,
        });
      } catch (err) {
        console.error('Erro ao carregar presenças:', err);
      } finally {
        setPresenceLoading(false);
      }
    }

    loadPresences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenceDate]);

  // Filtrar mercados por província seleccionada para os dropdowns
  const mercadosFiltrados = selectedProvincia === 'todas'
    ? mercados
    : mercados.filter((m: any) => m.provincia === selectedProvincia);

  const balcoesFiltrados = selectedMercado === 'todos'
    ? []
    : mercadosFiltrados.filter((m: any) => m.id === selectedMercado);

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-bci-muted">
        A carregar estatísticas...
      </div>
    );
  }

  const PACOTE_CORES = {
    Mãezinha: '#e91e63',
    Mãe: '#9c27b0',
    'Mãe Grande': '#3f51b5',
    Mamoite: '#009688',
  };

  return (
    <div className="space-y-8">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-bci-line bg-white">
        <Calendar size={18} className="text-bci-magenta flex-shrink-0" />
        <span className="text-sm font-bold text-bci-ink flex-shrink-0">Período:</span>
        <div className="flex flex-wrap rounded-xl border border-bci-line bg-white p-1 gap-0.5">
          {(['dia', 'semana', 'mes', '3meses', '6meses', 'ano'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                period === p
                  ? 'bg-bci-magenta text-white'
                  : 'text-gray-500 hover:bg-pink-50'
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de localização */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-bci-line bg-white">
        <MapPin size={18} className="text-bci-magenta" />
        <span className="text-sm font-bold text-bci-ink">Filtrar por:</span>

        <select
          value={selectedProvincia}
          onChange={(e) => { setSelectedProvincia(e.target.value); setSelectedMercado('todos'); }}
          className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-magenta"
          aria-label="Filtrar por província"
        >
          <option value="todas">Todas as províncias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={selectedMercado}
          onChange={(e) => { setSelectedMercado(e.target.value); }}
          className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-magenta"
          aria-label="Filtrar por mercado"
          disabled={selectedProvincia === 'todas'}
        >
          <option value="todos">Todos os mercados</option>
          {mercadosFiltrados.map((m: any) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>

        <select
          value={selectedBalcao}
          onChange={(e) => setSelectedBalcao(e.target.value)}
          className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-magenta"
          aria-label="Filtrar por balcão"
          disabled={selectedMercado === 'todos'}
        >
          <option value="todos">Todos os balcões</option>
          {balcoesFiltrados.map((m: any) => (
            <option key={m.id} value={m.balcao || m.id}>{m.balcao || m.nome}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bankeiros', value: stats.totalBanqueiros, icon: Users, color: 'text-bci-magenta bg-pink-50' },
            { label: 'Líderes', value: stats.totalLideres, icon: Users, color: 'text-bci-blue bg-blue-50' },
            { label: 'Mercados', value: stats.totalMercados, icon: Store, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Contas Abertas', value: stats.contasAbertas, icon: Building2, color: 'text-bci-navy bg-bci-navySoft' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-bci-ink">{value}</p>
              <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
            </div>
          ))}
          {[
            { label: 'Contas Pendentes', value: stats.contasPendentes, color: 'text-amber-600 bg-amber-50' },
            { label: "TPA's Entregues", value: stats.tpasEntregues, color: 'text-emerald-600 bg-emerald-50' },
            { label: "TPA's Pendentes", value: stats.tpasPendentes, color: 'text-red-600 bg-red-50' },
            { label: 'Presentes Hoje', value: stats.presencasHoje, color: 'text-green-600 bg-green-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
              <p className="mt-3 text-2xl font-extrabold text-bci-ink">{value}</p>
              <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico de Contas por Período */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold text-bci-ink mb-4">
          Abertura de Contas ({periodLabel[period]})
        </h3>
        <div className="h-64 w-full">
          {contasPeriodo.length === 0 || contasPeriodo.every((d) => d.contas === 0) ? (
            <div className="flex h-full items-center justify-center text-sm text-bci-muted">
              Sem dados de contas para o período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contasPeriodo} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="contas" name="Contas" stroke="#0f4a8a" strokeWidth={3} dot={{ r: 4, fill: '#0f4a8a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Dois gráficos lado a lado: Pacotes e Províncias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
          <h3 className="text-sm font-bold text-bci-ink mb-4">
            Classes Zungueira Vendidas
          </h3>
          {pacotesData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-bci-muted">
              Sem dados de pacotes.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pacotesData}
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="valor"
                    nameKey="nome"
                    label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pacotesData.map((entry: { nome: string; color?: string }, index: number) => (
                      <Cell key={index} fill={(PACOTE_CORES as Record<string, string>)[entry.nome] || entry.color || '#e91e63'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
          <h3 className="text-sm font-bold text-bci-ink mb-4">
            Contas por Província
          </h3>
          {porProvincia.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-bci-muted">
              Sem dados de províncias.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porProvincia} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="provincia" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="contas" name="Contas" fill="#e91e63" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="banqueiros" name="Bankeiros" fill="#0f4a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Banqueiros e Líderes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-bci-line">
            <h3 className="font-extrabold text-bci-ink text-sm">Top Bankeiros</h3>
            <p className="text-xs text-bci-muted mt-0.5">Com mais contas abertas</p>
          </div>
          {porBanqueiro.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">Sem dados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr><th className="px-4 py-3">Bankeiro</th><th className="px-4 py-3">Contas</th></tr>
                </thead>
                <tbody>
                  {porBanqueiro.map((b, i) => (
                    <tr key={i} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{b.nome}</td>
                      <td className="px-4 py-3">{b.contas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-bci-line">
            <h3 className="font-extrabold text-bci-ink text-sm">Líderes Registados</h3>
            <p className="text-xs text-bci-muted mt-0.5">Cada líder vinculado ao seu balcão</p>
          </div>
          {porLider.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">Sem líderes registados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr><th className="px-4 py-3">Líder</th><th className="px-4 py-3">Mercado/Balcão</th></tr>
                </thead>
                <tbody>
                  {porLider.map((l, i) => (
                    <tr key={i} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{l.nome}</td>
                      <td className="px-4 py-3 text-bci-muted">{l.mercado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Monitoramento de Presenças */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="font-extrabold text-bci-ink">Mapa de Presenças</p>
            <p className="text-xs text-bci-muted">Monitoramento de presenças e faltas dos banqueiros</p>
          </div>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-bold text-bci-ink">
            Data:
            <input
              type="date"
              value={presenceDate}
              onChange={(e) => setPresenceDate(e.target.value)}
              className="ml-2 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
            />
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-bci-line bg-white p-4 text-center">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 mx-auto mb-1">
              <CheckCircle size={16} />
            </div>
            <p className="text-xl font-extrabold text-bci-ink">{presenceLoading ? '—' : presenceStats.presentes}</p>
            <p className="text-[10px] font-semibold text-bci-muted uppercase">Presentes</p>
          </div>
          <div className="rounded-xl border border-bci-line bg-white p-4 text-center">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 bg-amber-50 mx-auto mb-1">
              <Clock size={16} />
            </div>
            <p className="text-xl font-extrabold text-bci-ink">{presenceLoading ? '—' : presenceStats.atrasos}</p>
            <p className="text-[10px] font-semibold text-bci-muted uppercase">Atrasos</p>
          </div>
          <div className="rounded-xl border border-bci-line bg-white p-4 text-center">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 bg-red-50 mx-auto mb-1">
              <XCircle size={16} />
            </div>
            <p className="text-xl font-extrabold text-bci-ink">{presenceLoading ? '—' : presenceStats.faltas}</p>
            <p className="text-[10px] font-semibold text-bci-muted uppercase">Faltas</p>
          </div>
          <div className="rounded-xl border border-bci-line bg-white p-4 text-center">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 bg-gray-50 mx-auto mb-1">
              <Users size={16} />
            </div>
            <p className="text-xl font-extrabold text-bci-ink">{presenceLoading ? '—' : noRecordList.length}</p>
            <p className="text-[10px] font-semibold text-bci-muted uppercase">Sem registo</p>
          </div>
        </div>

        {/* Tabela de presenças */}
        <div className="rounded-xl border border-bci-line overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-bci-line">
            <h4 className="font-bold text-sm text-bci-ink">Registos de presença de {presenceDate}</h4>
          </div>
          {presenceLoading ? (
            <p className="py-8 text-center text-sm text-bci-muted">A carregar presenças...</p>
          ) : presenceList.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">Sem registos de presença para esta data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">Bankeiro</th>
                    <th className="px-4 py-3">Mercado</th>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Saída</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pontualidade</th>
                    <th className="px-4 py-3">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {presenceList.map((p) => (
                    <tr key={p.id} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{p.nome}</td>
                      <td className="px-4 py-3 text-bci-muted">{p.mercadoNome}</td>
                      <td className="px-4 py-3">{p.entrada ?? '—'}</td>
                      <td className="px-4 py-3">{p.saida ?? '—'}</td>
                      <td className="px-4 py-3"><PresenceBadge value={p.status} /></td>
                      <td className="px-4 py-3"><PunctualityBadge value={p.pontualidade} /></td>
                      <td className="px-4 py-3"><span className="text-xs font-semibold text-bci-muted capitalize">{p.origem}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bankeiros sem registo */}
        {!presenceLoading && noRecordList.length > 0 && (
          <div className="rounded-xl border border-bci-line overflow-hidden">
            <div className="px-4 py-3 border-b border-bci-line">
              <h4 className="font-bold text-sm text-bci-ink">Bankeiros sem presença ({noRecordList.length})</h4>
              <p className="text-xs text-bci-muted mt-0.5">Banqueiros sem registo de presença para esta data.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Mercado</th></tr>
                </thead>
                <tbody>
                  {noRecordList.map((b: any) => (
                    <tr key={b.id} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{b.nome}</td>
                      <td className="px-4 py-3 text-bci-muted">{b.mercadoNome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
