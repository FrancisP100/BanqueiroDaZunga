"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Smartphone,
  CheckCircle2,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminEditarCliente, adminEliminarCliente } from "@/app/admin/actions";

export default function AdminInspecionarCliente() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<any>(null);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "", bi: "", telefone: "", endereco: "", bi_emissao: "", bi_validade: "",
  });
  const [editError, setEditError] = useState("");
  const [editPending, setEditPending] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!id || typeof id !== "string") {
        if (!ignore) setError("ID inválido.");
        if (!ignore) setLoading(false);
        return;
      }

      try {
        if (!ignore) { setLoading(true); setError(null); }

        const [clienteRes, contasRes] = await Promise.all([
          supabase.from("clientes").select("*").eq("id", id).single(),
          supabase
            .from("accounts")
            .select("*, markets(nome), profiles(nome)")
            .eq("cliente_id", id)
            .order("created_at", { ascending: false }),
        ]);

        if (clienteRes.error) throw clienteRes.error;

        if (!ignore) {
          setCliente(clienteRes.data);
          setContas(contasRes.data ?? []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Erro ao carregar cliente:", err);
          setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => { ignore = true; };
  }, [id, supabase, refreshKey]);

  // Stats
  const totalContas = contas.length;
  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;

  // Edit handlers
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
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditPending(true);
    setEditError("");

    const formData = new FormData();
    formData.set("cliente_id", id ?? "");
    formData.set("nome", editForm.nome);
    formData.set("bi", editForm.bi);
    formData.set("telefone", editForm.telefone);
    formData.set("endereco", editForm.endereco);
    formData.set("bi_emissao", editForm.bi_emissao);
    formData.set("bi_validade", editForm.bi_validade);

    const res = await adminEditarCliente(formData);
    if (res.error) {
      setEditError(res.error);
      setEditPending(false);
      return;
    }

    setEditOpen(false);
    setRefreshKey((k) => k + 1);
    setEditPending(false);
  }

  // Delete handlers
  async function handleDeleteConfirm() {
    if (!id || typeof id !== "string") return;
    setDeletePending(true);

    const res = await adminEliminarCliente(id);
    if (res.error) {
      alert(res.error);
    }

    setDeleteOpen(false);
    setDeletePending(false);
    // Redirect back to list
    window.location.href = "/admin/clientes";
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
        {error || "Cliente não encontrado."}
        <br />
        <Link href="/admin/clientes" className="mt-4 inline-block text-bci-navy underline">
          Voltar à lista
        </Link>
        <button onClick={() => setRefreshKey((k) => k + 1)} className="mt-4 ml-4 underline text-bci-navy">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-navy transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar à lista
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
              Inspecção de Cliente
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink break-words">
              {cliente.nome}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-bci-muted">
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} /> {cliente.bi}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {cliente.telefone ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {cliente.endereco ?? "—"}
              </span>
              {cliente.bi_emissao && (
                <span className="text-xs">Emissão BI: {cliente.bi_emissao}</span>
              )}
              {cliente.bi_validade && (
                <span className="text-xs">Validade BI: {cliente.bi_validade}</span>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={openEdit}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-600 hover:bg-amber-600 hover:text-white transition-colors"
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Contas", value: totalContas, icon: CreditCard, color: "text-bci-navy bg-bci-navySoft" },
          { label: "Contas Abertas", value: contasAbertas, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Contas Pendentes", value: contasPendentes, color: "text-amber-600 bg-amber-50" },
          { label: "TPA's Entregues", value: tpaEntregues, icon: Smartphone, color: "text-blue-600 bg-blue-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            {Icon && (
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-2`}>
                <Icon size={18} />
              </div>
            )}
            <p className="text-2xl font-extrabold text-bci-ink">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-bci-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Histórico de Contas */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex items-center gap-2">
          <Calendar size={16} className="text-bci-navy" />
          <h2 className="font-extrabold text-bci-ink">
            Histórico de Contas ({totalContas})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-4 py-3">Bankeiro</th>
                <th className="px-4 py-3">Mercado</th>
                <th className="px-4 py-3">Pacote</th>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">TPA</th>
                <th className="px-4 py-3">Nº Conta</th>
              </tr>
            </thead>
            <tbody>
              {contas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-bci-muted">
                    Sem contas registadas para este cliente.
                  </td>
                </tr>
              ) : (
                contas.map((c) => (
                  <tr key={c.id} className="border-t border-bci-line hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold">
                      {c.profiles?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-bci-muted">
                      {c.markets?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3">{c.pacote}</td>
                    <td className="px-4 py-3 text-bci-muted whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                      {c.hora_abertura && (
                        <span className="ml-1 text-[11px]">
                          {String(c.hora_abertura).slice(0, 5)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          c.status === "aberta"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status === "aberta" ? "Aberta" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          c.tpa_status === "entregue"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.tpa_status === "no_balcao"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.tpa_status === "entregue"
                          ? "Entregue"
                          : c.tpa_status === "no_balcao"
                          ? "No Balcão"
                          : c.tpa_status === "pendente"
                          ? "Pendente"
                          : c.tpa_status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bci-muted font-mono text-xs">
                      {c.numero_conta_banco ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botão de criar nova conta (link para a listagem) */}
      <div className="text-center">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-2 rounded-xl bg-bci-navy px-6 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors"
        >
          <CreditCard size={16} />
          Gerir Clientes
        </Link>
      </div>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bci-dark flex items-center gap-2">
              <Pencil size={18} className="text-amber-600" />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          {editError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {editError}
            </div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <label className="text-sm font-bold text-bci-ink">
              Nome completo
              <input
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
              />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              BI
              <input
                value={editForm.bi}
                onChange={(e) => setEditForm({ ...editForm, bi: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
              />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              Telefone
              <input
                value={editForm.telefone}
                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
              />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              Endereço
              <input
                value={editForm.endereco}
                onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold text-bci-ink">
                Emissão BI
                <input
                  type="date"
                  value={editForm.bi_emissao}
                  onChange={(e) => setEditForm({ ...editForm, bi_emissao: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
                />
              </label>
              <label className="text-sm font-bold text-bci-ink">
                Validade BI
                <input
                  type="date"
                  value={editForm.bi_validade}
                  onChange={(e) => setEditForm({ ...editForm, bi_validade: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
                />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editPending}
                className="flex-1 rounded-xl bg-bci-navy px-4 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors disabled:opacity-60"
              >
                <Save size={16} className="inline mr-1" />
                {editPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─── */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-bci-dark flex items-center gap-2">
              <Trash2 size={18} className="text-red-600" />
              Confirmar Eliminação
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-bci-muted">
            Tem a certeza que deseja eliminar este cliente e todas as suas contas?
            Esta acção não pode ser desfeita.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deletePending}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {deletePending ? "A eliminar..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
