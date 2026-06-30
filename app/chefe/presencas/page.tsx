'use client';

import { useEffect, useState, useTransition } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle, Clock, XCircle, Users } from 'lucide-react';
import { PresenceBadge, PunctualityBadge } from '@/components/ui/status-badge';
import type { PresenceStatus, Punctuality } from '@/lib/types';
import { updatePresence, createManualPresence } from '@/app/chefe/actions';

type PresenceRow = {
  id: string;
  profileId: string;
  nome: string;
  mercadoId: string | null;
  mercadoNome: string;
  entrada: string | null;
  saida: string | null;
  status: PresenceStatus;
  pontualidade: Punctuality;
  origem: string;
};

type BanqueiroRow = {
  id: string;
  nome: string;
  localId: string | null;
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function PresencasPage() {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today());
  const [presences, setPresences] = useState<PresenceRow[]>([]);
  const [banqueiros, setBanqueiros] = useState<BanqueiroRow[]>([]);
  const [marketMap, setMarketMap] = useState<Record<string, string>>({});

  // Dialog state
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

  useEffect(() => {
    loadData(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function loadData(d: string) {
    setLoading(true);

    const [bResult, mResult, pResult] = await Promise.all([
      supabase.from('profiles').select('id, nome, local_id').eq('papel', 'banqueiro').order('nome'),
      supabase.from('markets').select('id, nome'),
      supabase
        .from('presences')
        .select('id, profile_id, data, entrada, saida, status, pontualidade, origem, mercado_id, profiles(nome), markets(nome)')
        .eq('data', d)
        .order('entrada', { ascending: true }),
    ]);

    const mMap: Record<string, string> = {};
    (mResult.data ?? []).forEach((m: { id: string; nome: string }) => { mMap[m.id] = m.nome; });
    setMarketMap(mMap);

    const banqList: BanqueiroRow[] = (bResult.data ?? []).map((b: { id: string; nome: string; local_id: string | null }) => ({
      id: b.id,
      nome: b.nome,
      localId: b.local_id,
    }));
    setBanqueiros(banqList);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const presList: PresenceRow[] = (pResult.data ?? []).map((row: any) => ({
      id: row.id,
      profileId: row.profile_id,
      nome: Array.isArray(row.profiles) ? (row.profiles[0]?.nome ?? '') : (row.profiles?.nome ?? ''),
      mercadoId: row.mercado_id,
      mercadoNome: Array.isArray(row.markets) ? (row.markets[0]?.nome ?? '-') : (row.markets?.nome ?? '-'),
      entrada: row.entrada ? String(row.entrada).slice(0, 5) : null,
      saida: row.saida ? String(row.saida).slice(0, 5) : null,
      status: row.status as PresenceStatus,
      pontualidade: row.pontualidade as Punctuality,
      origem: row.origem,
    }));
    setPresences(presList);

    setLoading(false);
  }

  const presenceIds = new Set(presences.map((p) => p.profileId));
  const noRecord = banqueiros.filter((b) => !presenceIds.has(b.id));

  // Stats
  const presentCount = presences.filter((p) => p.status === 'no_local').length;
  const lateCount    = presences.filter((p) => p.pontualidade === 'atraso').length;
  const absentCount  = presences.filter((p) => p.status === 'falta').length + noRecord.length;

  function openEditDialog(p: PresenceRow) {
    setSelected(p);
    setSelectedBanqueiro(null);
    setNewStatus(p.status);
    setNewPontualidade(p.pontualidade);
    setObservacao('');
    setSubmitError('');
    setDialogOpen(true);
  }

  function openCreateDialog(b: BanqueiroRow) {
    setSelectedBanqueiro(b);
    setSelected(null);
    setNewStatus('falta');
    setNewPontualidade('falta');
    setObservacao('');
    setSubmitError('');
    setDialogOpen(true);
  }

  function handleSubmit() {
    setSubmitError('');
    startTransition(async () => {
      let result: { error?: string };
      if (selected) {
        result = await updatePresence(selected.id, newStatus, newPontualidade, observacao || undefined);
      } else if (selectedBanqueiro) {
        result = await createManualPresence(
          selectedBanqueiro.id,
          date,
          newStatus,
          newPontualidade,
          selectedBanqueiro.localId ?? undefined,
          observacao || undefined
        );
      } else {
        return;
      }

      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setDialogOpen(false);
      loadData(date);
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
            Gestão de Presenças
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
            Mapa de Presenças
          </h1>
        </div>

        <label className="text-sm font-bold text-bci-ink">
          Data
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bankeiros', value: banqueiros.length, icon: Users,        color: 'text-bci-blue bg-bci-blueSoft' },
          { label: 'Presentes',        value: presentCount,      icon: CheckCircle,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Atrasos',          value: lateCount,         icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Faltas / Sem reg', value: absentCount,       icon: XCircle,      color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-bci-ink">{loading ? '—' : value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Presences with record */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center justify-between">
          <h2 className="font-extrabold text-bci-ink">
            Registos de Presença — {date}
          </h2>
          <span className="text-sm font-semibold text-bci-muted">{presences.length} registos</span>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-bci-muted">A carregar…</p>
        ) : presences.length === 0 ? (
          <p className="py-10 text-center text-sm text-bci-muted">
            Sem presenças registadas para esta data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
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
                  <tr key={p.id} className="border-t border-bci-line hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold">{p.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">{p.mercadoNome}</td>
                    <td className="px-4 py-3">{p.entrada ?? '—'}</td>
                    <td className="px-4 py-3">{p.saida ?? '—'}</td>
                    <td className="px-4 py-3"><PresenceBadge value={p.status} /></td>
                    <td className="px-4 py-3"><PunctualityBadge value={p.pontualidade} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-bci-muted capitalize">{p.origem}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditDialog(p)}
                        className="rounded-lg bg-bci-blueSoft px-3 py-1.5 text-xs font-extrabold text-bci-blue hover:bg-bci-blue hover:text-white transition-colors whitespace-nowrap"
                      >
                        Correcção Manual
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banqueiros without record */}
      {!loading && noRecord.length > 0 && (
        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-bci-line">
            <h2 className="font-extrabold text-bci-ink">
              Sem Registo ({noRecord.length})
            </h2>
            <p className="mt-0.5 text-xs text-bci-muted">
              Bankeiros sem presença registada para {date}.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Mercado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {noRecord.map((b) => (
                  <tr key={b.id} className="border-t border-bci-line hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold">{b.nome}</td>
                    <td className="px-4 py-3 text-bci-muted">
                      {b.localId ? (marketMap[b.localId] ?? b.localId) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openCreateDialog(b)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Marcar Falta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft mx-4">
            <h3 className="text-lg font-extrabold text-bci-ink mb-1">
              {selected ? 'Correcção Manual' : 'Criar Registo de Falta'}
            </h3>
            <p className="text-sm text-bci-muted mb-5">
              {selected ? selected.nome : selectedBanqueiro?.nome}
            </p>

            {submitError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-bold text-bci-ink">
                Status de presença
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PresenceStatus)}
                  className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100"
                >
                  <option value="no_local">No local</option>
                  <option value="fora_do_local">Fora do local</option>
                  <option value="falta">Falta</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-bci-ink">
                Pontualidade
                <select
                  value={newPontualidade}
                  onChange={(e) => setNewPontualidade(e.target.value as Punctuality)}
                  className="mt-2 w-full rounded-xl border border-bci-line bg-white px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100"
                >
                  <option value="no_horario">No horário</option>
                  <option value="atraso">Atraso</option>
                  <option value="falta">Falta</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-bci-ink">
                Observação (opcional)
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium text-sm outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100 resize-none"
                  placeholder="Motivo da correcção ou observações…"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDialogOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 rounded-xl bg-bci-blue px-4 py-3 text-sm font-extrabold text-white hover:opacity-90 transition disabled:opacity-60"
              >
                {isPending ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
