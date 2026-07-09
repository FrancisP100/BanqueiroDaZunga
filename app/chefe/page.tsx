'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Users, CheckCircle, Clock, XCircle, ClipboardList, Search } from 'lucide-react';
import { PresenceBadge, PunctualityBadge } from '@/components/ui/status-badge';
import type { PresenceStatus, Punctuality } from '@/lib/types';
import { updatePresence, createManualPresence } from '@/app/chefe/actions';
import { getAllowedMarketIds } from '@/lib/leader-scope';

type PresenceRow = {
  id: string; profileId: string; nome: string; mercadoNome: string;
  entrada: string | null; saida: string | null;
  status: PresenceStatus; pontualidade: Punctuality; origem: string;
};

type BanqueiroRow = { id: string; nome: string; localId: string | null; mercadoNome: string };

function today() { return new Date().toISOString().split('T')[0]; }

export default function LiderDashboard() {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today());
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [banqueiros, setBanqueiros] = useState<BanqueiroRow[]>([]);
  const [marketMap, setMarketMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PresenceRow | null>(null);
  const [selectedBanqueiro, setSelectedBanqueiro] = useState<BanqueiroRow | null>(null);
  const [newStatus, setNewStatus] = useState<PresenceStatus>('falta');
  const [newPontualidade, setNewPontualidade] = useState<Punctuality>('falta');
  const [observacao, setObservacao] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => { loadData(date); /* eslint-disable-next-line */ }, [date]);

  async function loadData(d: string) {
    setLoading(true);

    const [mResult, bResult, pResult] = await Promise.all([
      supabase.from('markets').select('id, nome'),
      supabase.from('profiles').select('id, nome, local_id').eq('papel', 'banqueiro').order('nome'),
      supabase.from('presences')
        .select('id, profile_id, data, entrada, saida, status, pontualidade, origem, profiles(nome), markets(nome)')
        .eq('data', d),
    ]);

    // Build market map
    const mMap: Record<string, string> = {};
    (mResult.data ?? []).forEach((m: { id: string; nome: string }) => { mMap[m.id] = m.nome; });
    setMarketMap(mMap);

    // Determine which banqueiros this leader can see (same balcão)
    const allowedMarketIds = await getAllowedMarketIds(supabase);
    const canSeeAll = allowedMarketIds.size === 0;

    const banqList: BanqueiroRow[] = (bResult.data ?? [])
      .filter(b => canSeeAll || (b.local_id && allowedMarketIds.has(b.local_id)))
      .map((b: any) => ({
        id: b.id, nome: b.nome, localId: b.local_id, mercadoNome: b.local_id ? (mMap[b.local_id] ?? '—') : '—',
      }));
    setBanqueiros(banqList);

    const allowedProfileIds = new Set(banqList.map(b => b.id));
    const presList: PresenceRow[] = (pResult.data ?? [])
      .filter((row: any) => canSeeAll || allowedProfileIds.has(row.profile_id))
      .map((row: any) => ({
        id: row.id,
        profileId: row.profile_id,
        nome: Array.isArray(row.profiles) ? (row.profiles[0]?.nome ?? '') : (row.profiles?.nome ?? ''),
        mercadoNome: Array.isArray(row.markets) ? (row.markets[0]?.nome ?? '-') : (row.markets?.nome ?? '-'),
        entrada: row.entrada ? String(row.entrada).slice(0, 5) : null,
        saida: row.saida ? String(row.saida).slice(0, 5) : null,
        status: row.status, pontualidade: row.pontualidade, origem: row.origem,
      }));
    setPresences(presList);
    setLoading(false);
  }

  const presenceIds = new Set(presences.map((p) => p.profileId));
  const presentCount = presences.filter((p) => p.status === 'no_local').length;
  const lateCount = presences.filter((p) => p.pontualidade === 'atraso').length;
  const absentCount = presences.filter((p) => p.status === 'falta').length;
  const noRecord = banqueiros.filter((b) => !presenceIds.has(b.id));

  const filteredBanqueiros = banqueiros.filter((b) =>
    b.nome.toLowerCase().includes(search.toLowerCase()) || b.mercadoNome.toLowerCase().includes(search.toLowerCase())
  );

  function openEditDialog(p: PresenceRow) {
    setSelected(p); setSelectedBanqueiro(null);
    setNewStatus(p.status); setNewPontualidade(p.pontualidade);
    setObservacao(''); setSubmitError(''); setDialogOpen(true);
  }
  function openCreateDialog(b: BanqueiroRow) {
    setSelectedBanqueiro(b); setSelected(null);
    setNewStatus('falta'); setNewPontualidade('falta');
    setObservacao(''); setSubmitError(''); setDialogOpen(true);
  }
  function handleSubmit() {
    setSubmitError('');
    startTransition(async () => {
      let result: { error?: string };
      if (selected) {
        result = await updatePresence(selected.id, newStatus, newPontualidade, observacao || undefined);
      } else if (selectedBanqueiro) {
        result = await createManualPresence(selectedBanqueiro.id, date, newStatus, newPontualidade, selectedBanqueiro.localId ?? undefined, observacao || undefined);
      } else return;
      if (result.error) { setSubmitError(result.error); return; }
      setDialogOpen(false); loadData(date);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">Painel do Líder</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">Resumo Diário</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/chefe/relatorios" className="flex items-center gap-2 rounded-xl border border-bci-line bg-white px-5 py-2.5 text-sm font-extrabold text-bci-blue hover:bg-bci-blueSoft transition">
            <ClipboardList size={16} /> Relatórios
          </Link>
          <Link href="/chefe/presencas" className="flex items-center gap-2 rounded-xl bg-bci-blue px-5 py-2.5 text-sm font-extrabold text-white hover:opacity-90 transition">
            <ClipboardList size={16} /> Ver todas as presenças
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-bci-ink">
          Data:
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bankeiros', value: banqueiros.length, icon: Users, color: 'text-bci-blue bg-bci-blueSoft' },
          { label: 'Presentes', value: presentCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Atrasos', value: lateCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Faltas', value: absentCount, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
            <p className="mt-3 text-2xl font-extrabold text-bci-ink">{loading ? '—' : value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Presences Table — com nome do banqueiro e horário de saída */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line">
          <h2 className="font-extrabold text-bci-ink">Presenças de {date}</h2>
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-bci-muted">A carregar presenças…</p>
        ) : presences.length === 0 ? (
          <p className="py-10 text-center text-sm text-bci-muted">Sem registos de presença para esta data.</p>
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
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {presences.map((p) => (
                  <tr key={p.id} className="border-t border-bci-line">
                    <td className="px-4 py-3 font-bold">{p.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">{p.mercadoNome}</td>
                    <td className="px-4 py-3">{p.entrada ?? '—'}</td>
                    <td className="px-4 py-3">{p.saida ?? '—'}</td>
                    <td className="px-4 py-3"><PresenceBadge value={p.status} /></td>
                    <td className="px-4 py-3"><PunctualityBadge value={p.pontualidade} /></td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold text-bci-muted capitalize">{p.origem}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEditDialog(p)} className="rounded-lg bg-bci-blueSoft px-3 py-1.5 text-xs font-extrabold text-bci-blue hover:bg-bci-blue hover:text-white transition-colors">Corrigir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && noRecord.length > 0 && (
        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-bci-line">
            <h2 className="font-extrabold text-bci-ink">Sem registo ({noRecord.length})</h2>
            <p className="text-xs text-bci-muted mt-0.5">Bankeiros sem presença registada para esta data.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Mercado</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {noRecord.map((b) => (
                  <tr key={b.id} className="border-t border-bci-line">
                    <td className="px-4 py-3 font-bold">{b.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">{b.mercadoNome}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openCreateDialog(b)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-colors">Marcar Falta</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOVO: lista de todos os banqueiros, com info completa */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-bci-ink">Bankeiros sob gestão</h2>
            <p className="text-xs text-bci-muted mt-0.5">{banqueiros.length} banqueiros registados</p>
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
              <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Mercado</th><th className="px-4 py-3">Presença hoje</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {filteredBanqueiros.map((b) => {
                const pres = presences.find((p) => p.profileId === b.id);
                return (
                  <tr key={b.id} className="border-t border-bci-line hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold">{b.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">{b.mercadoNome}</td>
                    <td className="px-4 py-3">{pres ? <PresenceBadge value={pres.status} /> : <span className="text-bci-muted text-xs">Sem registo</span>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/chefe/banqueiros/${b.id}`} className="rounded-lg bg-bci-navySoft px-3 py-1.5 text-xs font-extrabold text-bci-navy hover:bg-bci-navy hover:text-white transition-colors">
                        Inspecionar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft mx-4">
            <h3 className="text-lg font-extrabold text-bci-ink mb-1">{selected ? 'Correcção Manual' : 'Marcar Falta'}</h3>
            <p className="text-sm text-bci-muted mb-5">{selected ? selected.nome : selectedBanqueiro?.nome}</p>
            {submitError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{submitError}</div>}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-bci-ink">Status de presença
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as PresenceStatus)}
                  className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100">
                  <option value="no_local">No local</option><option value="fora_do_local">Fora do local</option><option value="falta">Falta</option>
                </select>
              </label>
              <label className="block text-sm font-bold text-bci-ink">Pontualidade
                <select value={newPontualidade} onChange={(e) => setNewPontualidade(e.target.value as Punctuality)}
                  className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100">
                  <option value="no_horario">No horário</option><option value="atraso">Atraso</option><option value="falta">Falta</option>
                </select>
              </label>
              <label className="block text-sm font-bold text-bci-ink">Observação (opcional)
                <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
                  className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100 resize-none" placeholder="Motivo da correcção..." />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDialogOpen(false)} className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
              <button onClick={handleSubmit} disabled={isPending} className="flex-1 rounded-xl bg-bci-blue px-4 py-3 text-sm font-extrabold text-white hover:opacity-90 transition disabled:opacity-60">{isPending ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}