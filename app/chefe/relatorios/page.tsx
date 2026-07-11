'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { FileBarChart, CreditCard, Package, Building2 } from 'lucide-react';
import type { ReportPeriod } from '@/lib/types';
import { getAllowedMarketIds } from '@/lib/leader-scope';

function getRangeStart(period: ReportPeriod): string {
  const now = new Date();
  const d = new Date(now);
  if (period === 'dia') { /* hoje */ }
  else if (period === 'semana') d.setDate(now.getDate() - 7);
  else if (period === 'mes') d.setMonth(now.getMonth() - 1);
  else if (period === 'ano') d.setFullYear(now.getFullYear() - 1);
  return d.toISOString();
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<ReportPeriod>('dia');
  const [balcaoFiltro, setBalcaoFiltro] = useState<string>('todos');
  const [provinciaFiltro, setProvinciaFiltro] = useState<string>('todas');
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [porBanqueiro, setPorBanqueiro] = useState<Record<string, { nome: string; contas: number; tpa: number }>>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const since = getRangeStart(period);

      const { data: mkts } = await supabase.from('markets').select('id, nome, provincia, balcao');
      setMarkets(mkts ?? []);

      const { data: accs } = await supabase
        .from('accounts')
        .select('id, pacote, status, tpa_status, created_at, mercado_id, banqueiro_id, profiles(nome), markets(nome, balcao, provincia)')
        .gte('created_at', since);

      let filtered = accs ?? [];

      // Filter by this leader's balcão
      const allowedMarketIds = await getAllowedMarketIds(supabase);
      const canSeeAll = allowedMarketIds.size === 0;
      if (!canSeeAll) {
        filtered = filtered.filter((a: any) => a.mercado_id && allowedMarketIds.has(a.mercado_id));
      }

      if (balcaoFiltro !== 'todos') {
        filtered = filtered.filter((a: any) => a.mercado_id === balcaoFiltro);
      }
      if (provinciaFiltro !== 'todas') {
        filtered = filtered.filter((a: any) => a.markets?.provincia === provinciaFiltro);
      }

      setAccounts(filtered);

      const grouped: Record<string, { nome: string; contas: number; tpa: number }> = {};
      filtered.forEach((a: any) => {
        const key = a.banqueiro_id;
        const nome = Array.isArray(a.profiles) ? a.profiles[0]?.nome : a.profiles?.nome;
        if (!grouped[key]) grouped[key] = { nome: nome ?? '—', contas: 0, tpa: 0 };
        grouped[key].contas += 1;
        if (a.tpa_status === 'entregue') grouped[key].tpa += 1;
      });
      setPorBanqueiro(grouped);

      setLoading(false);
    }
    load();
    // eslint-disable-next-line
  }, [period, balcaoFiltro, provinciaFiltro]);

  const contasAbertas = accounts.filter((a) => a.status === 'aberta').length;
  const pacotesVendidos = accounts.length;
  const tpasEntregues = accounts.filter((a) => a.tpa_status === 'entregue').length;
  const tpasPendentes = accounts.filter((a) => a.tpa_status === 'pendente').length;

  const provincias = Array.from(new Set(markets.map((m) => m.provincia)));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">Relatórios</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">O verdadeiro relatório</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-xl border border-bci-line bg-white p-1">
          {(['dia', 'semana', 'mes', 'ano'] as ReportPeriod[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${period === p ? 'bg-bci-blue text-white' : 'text-bci-muted hover:bg-bci-blueSoft'}`}>
              {p}
            </button>
          ))}
        </div>

        <select
  value={balcaoFiltro}
  onChange={(e) => setBalcaoFiltro(e.target.value)}
  aria-label="Filtrar por mercado ou balcão"
  className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-blue"
>
  <option value="todos">Todos os mercados/balcões</option>
  {markets.map((m) => <option key={m.id} value={m.id}>{m.nome} {m.balcao ? `(${m.balcao})` : ''}</option>)}
</select>

<select
  value={provinciaFiltro}
  onChange={(e) => setProvinciaFiltro(e.target.value)}
  aria-label="Filtrar por província"
  className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-blue"
>
  <option value="todas">Todas as províncias</option>
  {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
</select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contas Abertas', value: contasAbertas, icon: FileBarChart, color: 'text-bci-blue bg-bci-blueSoft' },
          { label: 'Pacotes Vendidos', value: pacotesVendidos, icon: Package, color: 'text-emerald-600 bg-emerald-50' },
          { label: "TPA's Entregues", value: tpasEntregues, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
          { label: "TPA's Pendentes", value: tpasPendentes, icon: CreditCard, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
            <p className="mt-3 text-2xl font-extrabold text-bci-ink">{loading ? '—' : value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Por banqueiro */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center gap-2">
          <Building2 size={16} className="text-bci-blue" />
          <h2 className="font-extrabold text-bci-ink">Desempenho por banqueiro — {period}</h2>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-bci-muted">A carregar…</p>
        ) : Object.keys(porBanqueiro).length === 0 ? (
          <p className="py-10 text-center text-sm text-bci-muted">Sem dados para o período seleccionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr><th className="px-4 py-3">Bankeiro</th><th className="px-4 py-3">Contas/Pacotes</th><th className="px-4 py-3">TPA's Entregues</th></tr>
              </thead>
              <tbody>
                {Object.entries(porBanqueiro).map(([id, info]) => (
                  <tr key={id} className="border-t border-bci-line">
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
    </div>
  );
}