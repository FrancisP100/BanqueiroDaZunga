'use client';

import { useEffect, useState, useTransition } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Bell,
  Send,
  AlertTriangle,
  CheckCircle2,
  Search,
  Users,
} from 'lucide-react';
import { notificarTpasPendentes } from '@/app/chefe/actions';
import { getAllowedMarketIds } from '@/lib/leader-scope';

type ClienteTpaPendente = {
  contaId: string;
  clienteId?: string;
  clienteNome: string;
  clienteBi: string;
  banqueiroId: string;
  banqueiroNome: string;
  pacote: string;
  dataAbertura: string;
};

export default function NotificacoesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteTpaPendente[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);
  const [mensagem, setMensagem] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { marketIds, isUnrestricted } = await getAllowedMarketIds(supabase);

        // Fetch accounts with pending TPA
        let query = supabase
          .from('accounts')
          .select('id, pacote, created_at, banqueiro_id, mercado_id, clientes(id, nome, bi), profiles(nome)')
          .eq('tpa_status', 'pendente')
          .order('created_at', { ascending: false });

        const { data: accs } = await query;

        let filtered: any[] = accs ?? [];

        // Filter by leader's balcao if restricted
        if (!isUnrestricted) {
          filtered = filtered.filter(
            (a: any) => a.mercado_id && marketIds.has(a.mercado_id),
          );
        }

        setClientes(
          filtered.map((a: any) => ({
            contaId: a.id,
            clienteId: a.clientes?.id,
            clienteNome: a.clientes?.nome ?? '---',
            clienteBi: a.clientes?.bi ?? '---',
            banqueiroId: a.banqueiro_id,
            banqueiroNome: Array.isArray(a.profiles) ? (a.profiles[0]?.nome ?? '---') : (a.profiles?.nome ?? '---'),
            pacote: a.pacote,
            dataAbertura: new Date(a.created_at).toLocaleDateString(),
          })),
        );
      } catch (err) {
        console.error('Erro ao carregar TPAs pendentes:', err);        } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelect(contaId: string) {
    const next = new Set(selectedIds);
    if (next.has(contaId)) next.delete(contaId);
    else next.add(contaId);
    setSelectedIds(next);
  }

  function selectAll() {
    if (selectedIds.size === filteredClientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClientes.map((c) => c.contaId)));
    }
  }

  function handleEnviar() {
    const selected = clientes.filter((c) => selectedIds.has(c.contaId));
    if (selected.length === 0) return;

    const payload = selected.map((c) => ({
      banqueiroId: c.banqueiroId,
      clienteNome: c.clienteNome,
      contaId: c.contaId,
      clienteId: c.clienteId,
    }));

    setResult(null);
    startTransition(async () => {
      const res = await notificarTpasPendentes(payload, mensagem || undefined);
      if (res.error) {
        setResult({ error: res.error });
      } else {
        setResult({ success: `${res.count} notificaç${res.count === 1 ? 'ão' : 'ões'} enviada${res.count === 1 ? '' : 's'} com sucesso!` });
        setSelectedIds(new Set());
        setMensagem('');
      }
    });
  }

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.clienteNome.toLowerCase().includes(q) ||
      c.clienteBi.toLowerCase().includes(q) ||
      c.banqueiroNome.toLowerCase().includes(q)
    );
  });

  // Group by banqueiro
  const groupedByBanqueiro: Record<string, { nome: string; clientes: ClienteTpaPendente[] }> = {};
  filteredClientes.forEach((c) => {
    if (!groupedByBanqueiro[c.banqueiroId]) {
      groupedByBanqueiro[c.banqueiroId] = { nome: c.banqueiroNome, clientes: [] };
    }
    groupedByBanqueiro[c.banqueiroId].clientes.push(c);
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
          Gestão de Alertas
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Alertas de TPA Pendente
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Selecione os clientes com TPA pendente e notifique os Bankeiros responsáveis.
        </p>
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            result.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {result.success ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} /> {result.success}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <AlertTriangle size={18} /> {result.error}
            </span>
          )}
        </div>
      )}

      {/* Search and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-bci-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cliente, BI ou banqueiro..."
            className="pl-9 w-full sm:w-80 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={selectAll}
            className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-bold text-bci-muted hover:bg-bci-bg transition-colors"
          >
            {selectedIds.size === filteredClientes.length ? 'Desmarcar todos' : 'Seleccionar todos'}
          </button>
          <button
            onClick={handleEnviar}
            disabled={selectedIds.size === 0 || isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-bci-blue px-5 py-2 text-sm font-extrabold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            <Send size={16} />
            {isPending
              ? 'A enviar...'
              : `Notificar (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Mensagem opcional */}
      <div>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Mensagem opcional para os Bankeiros (deixe em branco para usar a mensagem padrão)..."
          rows={2}
          className="w-full rounded-xl border border-bci-line px-4 py-3 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100 resize-none"
        />
      </div>

      {/* Lista de clientes por banqueiro */}
      {loading ? (
        <div className="py-20 text-center text-sm text-bci-muted">
          A carregar TPAs pendentes...
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-20 text-center shadow-card">
          <Bell className="mx-auto h-10 w-10 text-bci-muted" />
          <p className="mt-4 text-sm font-bold text-bci-muted">
            Nenhum cliente com TPA pendente.
          </p>
          <p className="text-xs text-bci-muted">
            Todos os TPAs estão entregues ou não há contas registadas.
          </p>
        </div>
      ) : Object.keys(groupedByBanqueiro).length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-20 text-center shadow-card">
          <Search className="mx-auto h-10 w-10 text-bci-muted" />
          <p className="mt-4 text-sm font-bold text-bci-muted">
            Nenhum resultado para &quot;{search}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByBanqueiro).map(([banqueiroId, group]) => (
            <div
              key={banqueiroId}
              className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-bci-line bg-slate-50 px-5 py-3">
                <Users size={16} className="text-bci-blue" />
                <h2 className="font-extrabold text-bci-ink">
                  {group.nome}
                </h2>
                <span className="ml-auto text-xs font-semibold text-bci-muted">
                  {group.clientes.length} cliente{group.clientes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-bci-muted">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={group.clientes.every((c) => selectedIds.has(c.contaId))}
                          onChange={() => {
                            const allSelected = group.clientes.every((c) => selectedIds.has(c.contaId));
                            const next = new Set(selectedIds);
                            group.clientes.forEach((c) => {
                              if (allSelected) next.delete(c.contaId);
                              else next.add(c.contaId);
                            });
                            setSelectedIds(next);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-bci-blue focus:ring-bci-blue"
                        />
                      </th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">BI</th>
                      <th className="px-4 py-3">Pacote</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.clientes.map((c) => (
                      <tr
                        key={c.contaId}
                        className={`border-t border-bci-line hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          selectedIds.has(c.contaId) ? 'bg-bci-blueSoft/30' : ''
                        }`}
                        onClick={() => toggleSelect(c.contaId)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.contaId)}
                            onChange={() => toggleSelect(c.contaId)}
                            className="h-4 w-4 rounded border-gray-300 text-bci-blue focus:ring-bci-blue"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold">{c.clienteNome}</td>
                        <td className="px-4 py-3 text-bci-muted">{c.clienteBi}</td>
                        <td className="px-4 py-3">{c.pacote}</td>
                        <td className="px-4 py-3 text-bci-muted">{c.dataAbertura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
