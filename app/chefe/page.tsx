'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Users, ClipboardList, Search } from 'lucide-react';
import { getAllowedMarketIds } from '@/lib/leader-scope';

type BanqueiroRow = { id: string; nome: string; mercadoNome: string };

export default function LiderDashboard() {
  const [loading, setLoading] = useState(true);
  const [banqueiros, setBanqueiros] = useState<BanqueiroRow[]>([]);
  const [search, setSearch] = useState('');

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

    const allowedMarketIds = await getAllowedMarketIds(supabase);
    const canSeeAll = allowedMarketIds.size === 0;

    const banqList: BanqueiroRow[] = (bResult.data ?? [])
      .filter(b => canSeeAll || (b.local_id && allowedMarketIds.has(b.local_id)))
      .map((b: any) => ({
        id: b.id,
        nome: b.nome,
        mercadoNome: b.local_id ? (mMap[b.local_id] ?? '—') : '—',
      }));
    setBanqueiros(banqList);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBanqueiros = banqueiros.filter((b) =>
    b.nome.toLowerCase().includes(search.toLowerCase()) || b.mercadoNome.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-bci-blue bg-bci-blueSoft"><Users size={20} /></div>
          <p className="mt-3 text-2xl font-extrabold text-bci-ink">{loading ? '—' : banqueiros.length}</p>
          <p className="mt-0.5 text-xs font-semibold text-bci-muted">Total Bankeiros</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">Monitoramento</p>
          <p className="mt-2 text-sm text-bci-muted">Presenças e faltas disponíveis no painel do Administrador</p>
        </div>
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
