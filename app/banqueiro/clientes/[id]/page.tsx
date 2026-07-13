"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from '@/lib/supabase/client';
import {
  ArrowLeft, UserCircle, CreditCard, Phone, MapPin, Calendar,
  CheckCircle2, Pencil, Trash2, X, Save
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ativarConta, atualizarTpaStatus, editarCliente, eliminarCliente, eliminarConta } from "@/app/banqueiro/actions";

export default function InspecionarCliente() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [silentReload, setSilentReload] = useState(0);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", bi: "", telefone: "", endereco: "", bi_emissao: "", bi_validade: "" });
  const [editError, setEditError] = useState("");

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "cliente" | "conta"; id: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let ignore = false;
    const silent = silentReload > 0;

    async function loadData() {
      if (!id || typeof id !== "string") {
        if (!ignore) setError("ID inválido.");
        if (!ignore) setLoading(false);
        return;
      }

      if (!silent && !ignore) setLoading(true);
      if (!silent && !ignore) setError(null);

      const { data: clienteData, error: clienteErr } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      if (clienteErr) {
        if (!ignore) {
          console.error("Erro ao actualizar dados:", clienteErr);
          throw clienteErr;
        }
        return;
      }

      if (!ignore) setCliente(clienteData);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || ignore) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", auth.user.id)
        .single();

      if (profile && !ignore) {
        const { data: accountsData } = await supabase
          .from("accounts")
          .select("*, markets(nome)")
          .eq("cliente_id", id)
          .eq("banqueiro_id", profile.id)
          .order("created_at", { ascending: false });

        setContas(accountsData ?? []);
      }
    }

    loadData().catch((err: unknown) => {
      if (!ignore) {
        console.error("Erro ao carregar cliente:", err);
        setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
      }
    }).finally(() => {
      if (!ignore) setLoading(false);
    });

    return () => { ignore = true; };
  }, [id, supabase, refreshKey, silentReload]);

  async function loadDataSilent() {
    setSilentReload(k => k + 1);
  }

  async function handleActivate(contaId: string) {
    setPending(true);
    try {
      const result = await ativarConta(contaId);
      if (result.error) { alert(result.error); return; }
      await loadDataSilent();
    } finally {
      setPending(false);
    }
  }

  async function handleTpaToggle(contaId: string, currentStatus: string) {
    setPending(true);
    try {
      const newStatus = currentStatus === "entregue" ? "pendente" : "entregue";
      const result = await atualizarTpaStatus(contaId, newStatus as "pendente" | "entregue");
      if (result.error) { alert(result.error); return; }
      await loadDataSilent();
    } finally {
      setPending(false);
    }
  }

  function openEdit() {
    if (!cliente) return;
    setEditForm({
      nome: cliente.nome ?? "",
      bi: cliente.bi ?? "",
      telefone: cliente.telefone ?? "",
      endereco: cliente.endereco ?? "",
      bi_emissao: cliente.bi_emissao ?? "",
      bi_validade: cliente.bi_validade ?? "",
    });
    setEditError("");
    setEditOpen(true);
  }    async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setEditError("");

    const formData = new FormData();
    formData.set("cliente_id", id ?? "");
    formData.set("nome", editForm.nome);
    formData.set("bi", editForm.bi);
    formData.set("telefone", editForm.telefone);
    formData.set("endereco", editForm.endereco);
    formData.set("bi_emissao", editForm.bi_emissao);
    formData.set("bi_validade", editForm.bi_validade);

    const result = await editarCliente(formData);
    if (result.error) {
      setEditError(result.error);
      setPending(false);
      return;
    }

    setEditOpen(false);
    await loadDataSilent();
    setPending(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setPending(true);

    let result: { error?: string };
    if (deleteTarget.type === "cliente") {
      result = await eliminarCliente(deleteTarget.id);
    } else {
      result = await eliminarConta(deleteTarget.id);
    }

    if (result.error) { alert(result.error); setPending(false); return; }

    setDeleteOpen(false);
    setPending(false);

    if (deleteTarget.type === "cliente") {
      router.push("/banqueiro/clientes");
    } else {
      await loadDataSilent();
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-bci-muted">
        A carregar dados do cliente...
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="py-20 text-center text-red-600">
        {error || "Cliente não encontrado."}<br />
        <Link href="/banqueiro/clientes" className="mt-4 inline-block text-bci-magenta underline">
          Voltar à lista
        </Link>
        <button onClick={() => setRefreshKey(k => k + 1)} className="mt-4 ml-4 underline text-bci-magenta">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/banqueiro/clientes"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-magenta transition-colors"
      >
        <ArrowLeft size={16} /> Voltar à lista
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="rounded-2xl border border-bci-line bg-white p-4 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-bci-magenta/70">
              Inspecção de Cliente
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-bci-ink break-words">
              {cliente.nome}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-bci-muted">
              <span className="flex items-center gap-1.5"><CreditCard size={13} className="sm:size-[14px]" /> {cliente.bi}</span>
              <span className="flex items-center gap-1.5"><Phone size={13} className="sm:size-[14px]" /> {cliente.telefone ?? "—"}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} className="sm:size-[14px]" /> {cliente.endereco ?? "—"}</span>
              {cliente.bi_emissao && <span className="text-[10px] sm:text-xs">Emissão BI: {cliente.bi_emissao}</span>}
              {cliente.bi_validade && <span className="text-[10px] sm:text-xs">Validade BI: {cliente.bi_validade}</span>}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button onClick={openEdit}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-lg bg-bci-goldSoft px-3 py-1.5 text-xs font-extrabold text-bci-gold hover:bg-bci-gold hover:text-white transition-colors"
            >
              <Pencil size={14} /> Editar
            </button>
            <button onClick={() => { setDeleteTarget({ type: "cliente", id: cliente.id }); setDeleteOpen(true); }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Contas do cliente */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-bci-magenta" />
            <h2 className="font-extrabold text-bci-ink">Contas ({contas.length})</h2>
          </div>
        </div>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs sm:text-sm min-w-[550px] sm:min-w-0">
            <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-2 sm:px-4 py-3">Pacote</th>
                <th className="hidden sm:table-cell px-2 sm:px-4 py-3">Mercado</th>
                <th className="px-2 sm:px-4 py-3">Data/Hora</th>
                <th className="px-2 sm:px-4 py-3">Estado</th>
                <th className="px-2 sm:px-4 py-3">TPA</th>
                <th className="px-2 sm:px-4 py-3">Acções</th>
              </tr>
            </thead>
            <tbody>
              {contas.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-bci-muted">Sem contas registadas.</td></tr>
              ) : (
                contas.map((conta: any) => (
                  <tr key={conta.id} className="border-t border-bci-line hover:bg-slate-50/50">
                    <td className="px-2 sm:px-4 py-3 font-bold whitespace-nowrap">{conta.pacote}</td>
                    <td className="hidden sm:table-cell px-2 sm:px-4 py-3 text-bci-muted">{conta.markets?.nome ?? "—"}</td>
                    <td className="px-2 sm:px-4 py-3 text-bci-muted whitespace-nowrap">
                      {new Date(conta.created_at).toLocaleDateString()}
                      {conta.hora_abertura ? <span className="hidden sm:inline"> {String(conta.hora_abertura).slice(0, 5)}</span> : ""}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium leading-tight ${
                        conta.status === "aberta" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{conta.status === "aberta" ? "Aberta" : "Pend."}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <button
                        disabled={isPending}
                        onClick={() => handleTpaToggle(conta.id, conta.tpa_status)}
                        className={`group text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-1 rounded-full transition-all duration-300 ease-in-out whitespace-nowrap ${
                          conta.tpa_status === "entregue"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700 hover:bg-emerald-100 hover:text-emerald-700"
                        }`}
                      >
                        {conta.tpa_status === "entregue" ? (
                          "Entregue"
                        ) : (
                          <span className="relative">
                            <span className="group-hover:opacity-0 transition-opacity duration-300">Pend.</span>
                            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">Entregar</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                        {conta.status === "pendente" && (
                          <button
                            disabled={isPending}
                            onClick={() => handleActivate(conta.id)}
                            className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold text-white bg-bci-magenta px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full hover:bg-bci-magenta/90 disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckCircle2 size={10} className="sm:size-[12px]" />
                            <span className="hidden sm:inline">Activar</span>
                          </button>
                        )}
                        <button
                          disabled={isPending}
                          onClick={() => { setDeleteTarget({ type: "conta", id: conta.id }); setDeleteOpen(true); }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar conta"
                        >
                          <Trash2 size={13} className="sm:size-[14px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de Editar Cliente */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bci-dark">Editar Cliente</DialogTitle>
          </DialogHeader>
          {editError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{editError}</div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <label className="text-sm font-bold text-bci-ink">Nome completo
              <input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
            </label>
            <label className="text-sm font-bold text-bci-ink">BI
              <input value={editForm.bi} onChange={(e) => setEditForm({ ...editForm, bi: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
            </label>
            <label className="text-sm font-bold text-bci-ink">Telefone
              <input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
            </label>
            <label className="text-sm font-bold text-bci-ink">Endereço
              <input value={editForm.endereco} onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold text-bci-ink">Emissão BI
                <input type="date" value={editForm.bi_emissao} onChange={(e) => setEditForm({ ...editForm, bi_emissao: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
              </label>
              <label className="text-sm font-bold text-bci-ink">Validade BI
                <input type="date" value={editForm.bi_validade} onChange={(e) => setEditForm({ ...editForm, bi_validade: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-100" />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={isPending}
                className="flex-1 rounded-xl bg-bci-magenta px-4 py-3 text-sm font-extrabold text-white hover:bg-bci-magenta/90 transition-colors disabled:opacity-60">
                <Save size={16} className="inline mr-1" />{isPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-bci-dark">Confirmar Eliminação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-bci-muted">
            {deleteTarget?.type === "cliente"
              ? "Tem a certeza que deseja eliminar este cliente e todas as suas contas? Esta acção não pode ser desfeita."
              : "Tem a certeza que deseja eliminar esta conta? Esta acção não pode ser desfeita."}
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDeleteOpen(false)}
              className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
            <button onClick={handleDeleteConfirm} disabled={isPending}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
              {isPending ? "A eliminar..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
