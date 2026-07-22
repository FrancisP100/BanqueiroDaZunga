'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Users, ClipboardList, Search, Package, Building2, BarChart3, CheckCircle2, Smartphone } from 'lucide-react';
import { getAllowedMarketIds } from '@/lib/leader-scope';

type BanqueiroRow = { id: string; nome: string; mercadoNome: string };

export default function LiderDashboard() {
  const [loading, setLoading] = useState(true);
  const [banqueiros, setBanqueiros] = useState<BanqueiroRow[]>([]);
  const [search, setSearch] = useState('');

  // Stats state
  const [statsPeriod, setStatsPeriod] = useState<'mes' | '3meses' | 'ano'>('mes');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    contasAbertas: 0, contasPendentes: 0, totalContas: 0,
    tpasEntregues: 0, tpasPendentes: 0, tpasNoBalcao: 0,
  });
  const [porBanqueiro, setPorBanqueiro] = useState<Record<string, { nome: string; contas: number; tpa: number }>>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function loadData() {
    setLoading(true);

    const [mResult, bResult] = await Promise.all([
      supabase.from('markets').select('id, nome'),
      supabase.from('profiles').select('id, nome, local_id').eq('papel', 'banqueiro').order('nome'),
    ]);

    const mMap: Record<string, string> = {};
    (mResult.data ?? []).forEach((m: { id: string; nome: string }) => { mMap[m.id] = m.nome; });

    const { marketIds, isUnrestricted } = await getAllowedMarketIds(supabase);

    const banqList: BanqueiroRow[] = (bResult.data ?? [])
      .filter(b => isUnrestricted || (b.local_id && marketIds.has(b.local_id)))
      .map((b: any) => ({
        id: b.id,
        nome: b.nome,
        mercadoNome: b.local_id ? (mMap[b.local_id] ?? '—') : '—',
      }));
    setBanqueiros(banqList);

    // Also load stats after we have market info
    await loadStats(marketIds, isUnrestricted);

    setLoading(false);
  }

  async function loadStats(marketIds?: Set<string>, isUnrestricted?: boolean) {
    if (!marketIds && !isUnrestricted) {
      const result = await getAllowedMarketIds(supabase);
      marketIds = result.marketIds;
      isUnrestricted = result.isUnrestricted;
    }

    setStatsLoading(true);

    const periodStart = new Date();
    if (statsPeriod === '3meses') periodStart.setMonth(periodStart.getMonth() - 3);
    else if (statsPeriod === 'ano') periodStart.setFullYear(periodStart.getFullYear() - 1);
    else periodStart.setMonth(periodStart.getMonth() - 1);

    const { data: accs } = await supabase
      .from('accounts')
      .select('id, status, tpa_status, pacote, banqueiro_id, mercado_id, profiles(nome)')
      .gte('created_at', periodStart.toISOString());

    let filtered = accs ?? [];
    if (!isUnrestricted) {
      filtered = filtered.filter((a: any) => a.mercado_id && marketIds?.has(a.mercado_id));
    }

    setStats({
      totalContas: filtered.length,
      contasAbertas: filtered.filter((a: any) => a.status === 'aberta').length,
      contasPendentes: filtered.filter((a: any) => a.status === 'pendente').length,
      tpasEntregues: filtered.filter((a: any) => a.tpa_status === 'entregue').length,
      tpasPendentes: filtered.filter((a: any) => a.tpa_status === 'pendente').length,
      tpasNoBalcao: filtered.filter((a: any) => a.tpa_status === 'no_balcao').length,
    });

    // By bankeiro
    const grouped: Record<string, { nome: string; contas: number; tpa: number }> = {};
    filtered.forEach((a: any) => {
      const key = a.banqueiro_id;
      const nome = Array.isArray(a.profiles) ? a.profiles[0]?.nome : a.profiles?.nome;
      if (!grouped[key]) grouped[key] = { nome: nome ?? '—', contas: 0, tpa: 0 };
      grouped[key].contas += 1;
      if (a.tpa_status === 'entregue') grouped[key].tpa += 1;
    });
    setPorBanqueiro(grouped);

    setStatsLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload stats when period changes
  useEffect(() => {
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsPeriod]);

  const filteredBanqueiros = banqueiros.filter((b) =>
    b.nome.toLowerCase().includes(search.toLowerCase()) || b.mercadoNome.toLowerCase().includes(search.toLowerCase())
  );

  const periodLabel: Record<string, string> = { mes: '30 dias', '3meses': '3 meses', ano: '1 ano' };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">Painel do Líder</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">Meus Bankeiros</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/chefe/relatorios" className="flex items-center gap-2 rounded-xl border border-bci-line bg-white px-5 py-2.5 text-sm font-extrabold text-bci-blue hover:bg-bci-blueSoft transition">
            <ClipboardList size={16} /> Relatórios
          </Link>
        </div>
      </div>

      {/* Stats row 1: resumo geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-bci-blue bg-bci-blueSoft"><Users size={20} /></div>
          <p className="mt-3 text-2xl font-extrabold text-bci-ink">{loading ? '—' : banqueiros.length}</p>
          <p className="mt-0.5 text-xs font-semibold text-bci-muted">Total Bankeiros</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-emerald-600 bg-emerald-50"><CheckCircle2 size={20} /></div>
          <p className="mt-3 text-2xl font-extrabold text-bci-ink">{statsLoading ? '—' : stats.totalContas}</p>
          <p className="mt-0.5 text-xs font-semibold text-bci-muted">Total Contas ({periodLabel[statsPeriod]})</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amber-600 bg-amber-50"><Package size={20} /></div>
          <p className="mt-3 text-2xl font-extrabold text-bci-ink">{statsLoading ? '—' : stats.contasAbertas}</p>
          <p className="mt-0.5 text-xs font-semibold text-bci-muted">Contas Abertas</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-bci-magenta bg-pink-50"><BarChart3 size={20} /></div>
          <p className="mt-3 text-2xl font-extrabold text-bci-ink">{statsLoading ? '—' : stats.contasPendentes}</p>
          <p className="mt-0.5 text-xs font-semibold text-bci-muted">Pendentes</p>
        </div>
      </div>

      {/* Stats row 2: TPAs + período selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 mb-1.5">{statsLoading ? '—' : stats.tpasEntregues}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-bci-muted">TPA's Entregues</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 mb-1.5">{statsLoading ? '—' : stats.tpasPendentes}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-bci-muted">TPA's Pendentes</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 mb-1.5">
            {statsLoading ? '—' : stats.tpasNoBalcao}
            {stats.tpasNoBalcao > 0 && <Smartphone size={11} />}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-bci-muted">No Balcão</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card flex flex-col justify-center">
          <div className="flex rounded-lg border border-bci-line bg-white p-0.5 self-start">
            {(['mes', '3meses', 'ano'] as const).map((p) => (
              <button key={p} onClick={() => setStatsPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${statsPeriod === p ? 'bg-bci-blue text-white' : 'text-bci-muted hover:bg-bci-blueSoft'}`}>
                {periodLabel[p]}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-bci-muted mt-1.5">Período</p>
        </div>
      </div>

      {/* Desempenho por banqueiro */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center gap-2">
          <Building2 size={16} className="text-bci-blue" />
          <h2 className="font-extrabold text-bci-ink">Desempenho por Bankeiro — {periodLabel[statsPeriod]}</h2>
        </div>
        {statsLoading ? (
          <p className="py-8 text-center text-sm text-bci-muted">A carregar…</p>
        ) : Object.keys(porBanqueiro).length === 0 ? (
          <p className="py-8 text-center text-sm text-bci-muted">Sem dados para o período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr><th className="px-4 py-3">Bankeiro</th><th className="px-4 py-3">Contas/Classes</th><th className="px-4 py-3">TPA's Entregues</th></tr>
              </thead>
              <tbody>
                {Object.entries(porBanqueiro).map(([id, info]) => (
                  <tr key={id} className="border-t border-bci-line hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold">{info.nome}</td>
                    <td className="px-4 py-3">{info.contas}</td>
                    <td className="px-4 py-3">{info.tpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de banqueiros */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-bci-ink">Bankeiros sob gestão</h2>
            <p className="text-xs text-bci-muted mt-0.5">{banqueiros.length} Bankeiros registados</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-bci-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..."
              className="pl-9 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Mercado</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {filteredBanqueiros.map((b) => (
                <tr key={b.id} className="border-t border-bci-line hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold">{b.nome}</td>
                  <td className="px-4 py-3 text-bci-muted">{b.mercadoNome}</td>
                  <td className="px-4 py-3">
                    <Link href={`/chefe/banqueiros/${b.id}`} className="rounded-lg bg-bci-navySoft px-3 py-1.5 text-xs font-extrabold text-bci-navy hover:bg-bci-navy hover:text-white transition-colors">
                      Inspeccionar
                    </Link>
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
