'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
  Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Users, Store, Building2, MapPin } from 'lucide-react';

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

  // Dados detalhados por filtro
  const [contasSemana, setContasSemana] = useState<any[]>([]);
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
      }
    }
    loadInitial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar dados detalhados sempre que os filtros mudam
  useEffect(() => {
    async function loadFiltered() {
      setLoading(true);

      try {
        const marketsAll = mercados;
        const prov = selectedProvincia !== 'todas' ? selectedProvincia : null;
        const mkt = selectedMercado !== 'todos' ? selectedMercado : null;

        // Mercados filtrados pela selecção
        let mercadosFiltrados = marketsAll;
        if (prov) mercadosFiltrados = mercadosFiltrados.filter((m: any) => m.provincia === prov);
        if (mkt) mercadosFiltrados = mercadosFiltrados.filter((m: any) => m.id === mkt);

        const mercadoIds = mercadosFiltrados.map((m: any) => m.id);

        if (mercadoIds.length === 0) {
          setPorProvincia([]);
          setPorBanqueiro([]);
          setPorLider([]);
          setPacotesData([]);
          setContasSemana([]);
          setLoading(false);
          return;
        }

        // Contas filtradas pelos mercados
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

        // Últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const since = sevenDaysAgo.toISOString();

        const { data: recentAccounts } = await supabase
          .from('accounts')
          .select('created_at, mercado_id')
          .gte('created_at', since)
          .in('mercado_id', mercadoIds);

        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const contasPorDia: Record<string, number> = {};
        const hoje = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(hoje.getDate() - i);
          contasPorDia[diasSemana[d.getDay()]] = 0;
        }
        (recentAccounts ?? []).forEach((a: { created_at: string }) => {
          const d = new Date(a.created_at);
          const key = diasSemana[d.getDay()];
          if (contasPorDia[key] !== undefined) contasPorDia[key]++;
        });
        setContasSemana(
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

    // Só carregar depois de ter mercados
    if (mercados.length > 0) {
      loadFiltered();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvincia, selectedMercado, selectedBalcao, mercados.length]);

  // Filtrar mercados por província seleccionada para os dropdowns
  const mercadosFiltrados = selectedProvincia === 'todas'
    ? mercados
    : mercados.filter((m: any) => m.provincia === selectedProvincia);

  const balcoesFiltrados = selectedMercado === 'todos'
    ? []
    : mercadosFiltrados.filter((m: any) => m.id === selectedMercado);

  if (loading) {
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

      {/* Gráfico de Contas por Semana */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <h3 className="text-sm font-bold text-bci-ink mb-4">
          Abertura de Contas (Últimos 7 dias)
        </h3>
        <div className="h-64 w-full">
          {contasSemana.length === 0 || contasSemana.every((d) => d.contas === 0) ? (
            <div className="flex h-full items-center justify-center text-sm text-bci-muted">
              Sem dados de contas para o período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contasSemana} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
        {/* Pacotes vendidos (classes Zungueira) */}
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

        {/* Contas por Província */}
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
        {/* Top Banqueiros */}
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

        {/* Líderes */}
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
    </div>
  );
}
