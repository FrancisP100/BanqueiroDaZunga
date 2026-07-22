"use client";

import { useEffect, useState, useTransition } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Bell,
  Send,
  AlertTriangle,
  CheckCircle2,
  Search,
  Users,
  CreditCard,
  Smartphone,
  KeyRound,
} from "lucide-react";
import {
  notificarTpasPendentes,
  ativarContaComId,
  notificarTpaNoBalcao,
} from "@/app/chefe/actions";
import { getAllowedMarketIds } from "@/lib/leader-scope";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NotifType = "conta_ativada" | "tpa_balcao";

type ClienteItem = {
  contaId: string;
  clienteId?: string;
  clienteNome: string;
  clienteBi: string;
  banqueiroId: string;
  banqueiroNome: string;
  pacote: string;
  dataAbertura: string;
  status?: string;
  tpaStatus?: string;
};

const TIPO_OPTIONS: {
  value: NotifType;
  label: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "conta_ativada",
    label: "Conta Ativada",
    icon: KeyRound,
    desc: "Inserir o número de conta real do banco e activar a conta",
    color: "text-emerald-600",
    activeColor: "bg-emerald-600 text-white",
  },
  {
    value: "tpa_balcao",
    label: "TPA no Balcão",
    icon: Smartphone,
    desc: "Notificar que o TPA chegou ao balcão — Bankeiro confirma entrega",
    color: "text-blue-600",
    activeColor: "bg-blue-600 text-white",
  },
];

export default function NotificacoesPage() {
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<NotifType>("conta_ativada");
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  // Modal states for "Conta Ativada"
  const [modalOpen, setModalOpen] = useState(false);
  const [numeroConta, setNumeroConta] = useState("");
  const [dataActivacao, setDataActivacao] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [modalError, setModalError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { marketIds, isUnrestricted } = await getAllowedMarketIds(
          supabase,
        );

        if (tipo === "conta_ativada") {
          // Fetch accounts with pending status (not yet activated)
          let query = supabase
            .from("accounts")
            .select(
              "id, pacote, created_at, banqueiro_id, mercado_id, status, clientes(id, nome, bi), profiles(nome)",
            )
            .eq("status", "pendente")
            .order("created_at", { ascending: false });

          const { data: accs } = await query;
          let filtered: any[] = accs ?? [];

          if (!isUnrestricted) {
            filtered = filtered.filter(
              (a: any) => a.mercado_id && marketIds.has(a.mercado_id),
            );
          }

          setClientes(
            filtered.map((a: any) => ({
              contaId: a.id,
              clienteId: a.clientes?.id,
              clienteNome: a.clientes?.nome ?? "---",
              clienteBi: a.clientes?.bi ?? "---",
              banqueiroId: a.banqueiro_id,
              banqueiroNome: Array.isArray(a.profiles)
                ? a.profiles[0]?.nome ?? "---"
                : a.profiles?.nome ?? "---",
              pacote: a.pacote,
              dataAbertura: new Date(a.created_at).toLocaleDateString(),
              status: a.status,
            })),
          );
        } else {
          // Fetch accounts with pending TPA (not yet "no_balcao" or "entregue")
          let query = supabase
            .from("accounts")
            .select(
              "id, pacote, created_at, banqueiro_id, mercado_id, tpa_status, clientes(id, nome, bi), profiles(nome)",
            )
            .in("tpa_status", ["pendente"])
            .order("created_at", { ascending: false });

          const { data: accs } = await query;
          let filtered: any[] = accs ?? [];

          if (!isUnrestricted) {
            filtered = filtered.filter(
              (a: any) => a.mercado_id && marketIds.has(a.mercado_id),
            );
          }

          setClientes(
            filtered.map((a: any) => ({
              contaId: a.id,
              clienteId: a.clientes?.id,
              clienteNome: a.clientes?.nome ?? "---",
              clienteBi: a.clientes?.bi ?? "---",
              banqueiroId: a.banqueiro_id,
              banqueiroNome: Array.isArray(a.profiles)
                ? a.profiles[0]?.nome ?? "---"
                : a.profiles?.nome ?? "---",
              pacote: a.pacote,
              dataAbertura: new Date(a.created_at).toLocaleDateString(),
              tpaStatus: a.tpa_status,
            })),
          );
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load().catch(console.error);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    setSelectedIds(new Set());
    setResult(null);
  }, [tipo]);

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

  function handleNotificarClick() {
    const selected = clientes.filter((c) => selectedIds.has(c.contaId));
    if (selected.length === 0) return;

    if (tipo === "conta_ativada") {
      setNumeroConta("");
      setDataActivacao(new Date().toISOString().split("T")[0]);
      setModalError("");
      setModalOpen(true);
    } else {
      // TPA no Balcão — send directly
      const payload = selected.map((c) => ({
        contaId: c.contaId,
        banqueiroId: c.banqueiroId,
        clienteNome: c.clienteNome,
        clienteId: c.clienteId,
      }));

      setResult(null);
      startTransition(async () => {
        const res = await notificarTpaNoBalcao(payload);
        if (res.error) {
          setResult({ error: res.error });
        } else {
          setResult({
            success: `${res.count} notificaç${res.count === 1 ? "ão" : "ões"} enviada${res.count === 1 ? "" : "s"}! TPAs marcados como "No Balcão".`,
          });
          setSelectedIds(new Set());
        }
      });
    }
  }

  function handleConfirmarConta() {
    if (!numeroConta.trim()) {
      setModalError("O número de conta é obrigatório.");
      return;
    }

    const selected = clientes.filter((c) => selectedIds.has(c.contaId));
    setModalOpen(false);
    setResult(null);

    // Process each selected account sequentially
    startTransition(async () => {
      let successCount = 0;
      let errorMsg = "";

      for (const c of selected) {
        const res = await ativarContaComId(
          c.contaId,
          numeroConta.trim(),
          dataActivacao,
        );
        if (res.success) {
          successCount++;
        } else {
          errorMsg = res.error ?? "Erro desconhecido";
        }
      }

      if (successCount > 0) {
        setResult({
          success: `${successCount} conta${successCount === 1 ? "" : "s"} activada${successCount === 1 ? "" : "s"} com sucesso! Nº: ${numeroConta.trim()}`,
        });
        setSelectedIds(new Set());
      }
      if (errorMsg) {
        setResult({ error: errorMsg });
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
  const groupedByBanqueiro: Record<
    string,
    { nome: string; clientes: ClienteItem[] }
  > = {};
  filteredClientes.forEach((c) => {
    if (!groupedByBanqueiro[c.banqueiroId]) {
      groupedByBanqueiro[c.banqueiroId] = { nome: c.banqueiroNome, clientes: [] };
    }
    groupedByBanqueiro[c.banqueiroId].clientes.push(c);
  });

  const currentTipoConfig = TIPO_OPTIONS.find((o) => o.value === tipo)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
          Gestão de Alertas
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Enviar Notificações
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Selecione o tipo de notificação e os clientes a notificar.
        </p>
      </div>

      {/* Tipo Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TIPO_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = tipo === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTipo(opt.value)}
              className={`group relative rounded-2xl border p-5 text-left transition-all duration-200 ${
                isActive
                  ? `${opt.activeColor} shadow-lg border-transparent`
                  : "bg-white border-bci-line hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-white/20 text-white"
                    : `${opt.color} bg-gray-50 group-hover:scale-105`
                }`}
              >
                <Icon size={24} />
              </div>
              <h3
                className={`mt-4 text-lg font-extrabold ${
                  isActive ? "text-white" : "text-bci-ink"
                }`}
              >
                {opt.label}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  isActive ? "text-white/80" : "text-bci-muted"
                }`}
              >
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Result message */}
      {result && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
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
            {selectedIds.size === filteredClientes.length
              ? "Desmarcar todos"
              : "Seleccionar todos"}
          </button>
          <button
            onClick={handleNotificarClick}
            disabled={selectedIds.size === 0 || isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-bci-blue px-5 py-2 text-sm font-extrabold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            <Send size={16} />
            {isPending
              ? "A enviar..."
              : `Notificar (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {/* Info text based on type */}
      <div className="rounded-xl bg-slate-50 border border-bci-line px-4 py-3 text-xs text-bci-muted">
        {tipo === "conta_ativada" ? (
          <p>
            <strong className="text-bci-ink">Conta Ativada:</strong> Mostrando contas com estado{" "}
            <strong className="text-bci-ink">"pendente"</strong>. Selecione e clique em Notificar
            para inserir o número de conta real do banco.
          </p>
        ) : (
          <p>
            <strong className="text-bci-ink">TPA no Balcão:</strong> Mostrando contas com TPA{" "}
            <strong className="text-bci-ink">"pendente"</strong>. Ao notificar, o TPA é marcado como
            "no balcão" e o Bankeiro confirma a entrega.
          </p>
        )}
      </div>

      {/* Lista de clientes por banqueiro */}
      {loading ? (
        <div className="py-20 text-center text-sm text-bci-muted">
          A carregar dados...
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-20 text-center shadow-card">
          <Bell className="mx-auto h-10 w-10 text-bci-muted" />
          <p className="mt-4 text-sm font-bold text-bci-muted">
            {tipo === "conta_ativada"
              ? "Nenhuma conta pendente para activar."
              : "Nenhum TPA pendente para notificar."}
          </p>
          <p className="text-xs text-bci-muted">
            {tipo === "conta_ativada"
              ? "Todas as contas já foram activadas ou não há contas registadas."
              : "Todos os TPAs já foram processados ou não há contas registadas."}
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
          {Object.entries(groupedByBanqueiro).map(
            ([banqueiroId, group]) => (
              <div
                key={banqueiroId}
                className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden"
              >
                <div className="flex items-center gap-2 border-b border-bci-line bg-slate-50 px-5 py-3">
                  <Users size={16} className="text-bci-blue" />
                  <h2 className="font-extrabold text-bci-ink">{group.nome}</h2>
                  <span className="ml-auto text-xs font-semibold text-bci-muted">
                    {group.clientes.length} cliente
                    {group.clientes.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-bci-muted">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={group.clientes.every((c) =>
                              selectedIds.has(c.contaId),
                            )}
                            onChange={() => {
                              const allSelected = group.clientes.every((c) =>
                                selectedIds.has(c.contaId),
                              );
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
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.clientes.map((c) => (
                        <tr
                          key={c.contaId}
                          className={`border-t border-bci-line hover:bg-slate-50/50 cursor-pointer transition-colors ${
                            selectedIds.has(c.contaId)
                              ? "bg-bci-blueSoft/30"
                              : ""
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
                          <td className="px-4 py-3 font-bold">
                            {c.clienteNome}
                          </td>
                          <td className="px-4 py-3 text-bci-muted">
                            {c.clienteBi}
                          </td>
                          <td className="px-4 py-3">{c.pacote}</td>
                          <td className="px-4 py-3 text-bci-muted">
                            {c.dataAbertura}
                          </td>
                          <td className="px-4 py-3">
                            {tipo === "conta_ativada" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <CreditCard size={11} />
                                Pendente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Smartphone size={11} />
                                TPA Pend.
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* Modal for "Conta Ativada" — inserir número de conta */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bci-dark flex items-center gap-2">
              <KeyRound size={20} className="text-emerald-600" />
              Activiar Conta — Nº Bancário
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {modalError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {modalError}
              </div>
            )}

            <p className="text-sm text-bci-muted">
              A conta será activada para{" "}
              <strong className="text-bci-ink">
                {selectedIds.size} cliente
                {selectedIds.size !== 1 ? "s" : ""}
              </strong>
              . Insira o número de conta real do banco.
            </p>

            <div className="space-y-4">
              <label className="text-sm font-bold text-bci-ink">
                Número de Conta Bancária *
                <input
                  type="text"
                  value={numeroConta}
                  onChange={(e) => setNumeroConta(e.target.value)}
                  placeholder="Ex: 123456789"
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  autoFocus
                />
              </label>

              <label className="text-sm font-bold text-bci-ink">
                Data de Activação
                <input
                  type="date"
                  value={dataActivacao}
                  onChange={(e) => setDataActivacao(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarConta}
                disabled={isPending}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <KeyRound size={16} />
                {isPending ? "A activar..." : "Activiar Conta"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
