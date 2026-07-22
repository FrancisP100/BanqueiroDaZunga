"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  Smartphone,
  Search,
  Pencil,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
  UserPlus,
  Store,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAllClientes,
  adminEditarCliente,
  adminEliminarCliente,
  adminCriarConta,
} from "@/app/admin/actions";
import { createBrowserClient } from "@/lib/supabase/client";
import { PACOTES } from "@/lib/types";
import { ProvinciaSelect } from "@/components/ui/provincia-select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartTooltip } from "@/components/chart-tooltip";

export default function AdminClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtroProvincia, setFiltroProvincia] = useState("todas");
  const [filtroMercado, setFiltroMercado] = useState("todos");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    bi: "",
    telefone: "",
    endereco: "",
    bi_emissao: "",
    bi_validade: "",
  });
  const [editError, setEditError] = useState("");
  const [editPending, setEditPending] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  // Create account dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createClienteId, setCreateClienteId] = useState("");
  const [createForm, setCreateForm] = useState({
    banqueiro_id: "",
    pacote: PACOTES[0] as string,
    mercado_id: "",
  });
  const [createError, setCreateError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [bankeiros, setBankeiros] = useState<any[]>([]);
  const [mercados, setMercados] = useState<any[]>([]);

  // Result message
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function load() {
    setLoading(true);
    setResult(null);
    try {
      const res = await getAllClientes();
      if (res.data) {
        setClientes(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load clients
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Load markets on mount (needed for charts)
  useEffect(() => {
    async function loadMercados() {
      const { data } = await supabase
        .from("markets")
        .select("id, nome, provincia")
        .order("nome");
      setMercados(data ?? []);
    }
    loadMercados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats
  const totalClientes = clientes.length;
  const todasContas = clientes.flatMap((c: any) => c.accounts ?? []);
  const totalContas = todasContas.length;
  const contasAbertas = todasContas.filter((a: any) => a.status === "aberta").length;
  const contasPendentes = todasContas.filter((a: any) => a.status === "pendente").length;
  const tpasEntregues = todasContas.filter((a: any) => a.tpa_status === "entregue").length;
  const tpasPendentes = todasContas.filter((a: any) =>
    ["pendente", "no_balcao"].includes(a.tpa_status)
  ).length;

  // Classes distribution
  const classeCount: Record<string, number> = {};
  todasContas.forEach((a: any) => {
    const p = a.pacote || "Outro";
    classeCount[p] = (classeCount[p] || 0) + 1;
  });
  const classesData = Object.entries(classeCount)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // ─── Client counts by market ───
  const clientesPorMercado: { nome: string; clientes: number; contas: number }[] = [];
  const mercadoMap = new Map(mercados.map((m: any) => [m.id, m]));
  const contasPorMercado: Record<string, { clientes: Set<string>; contas: number }> = {};

  clientes.forEach((cliente: any) => {
    const contas = cliente.accounts ?? [];
    const mercadosVisitados = new Set<string>();
    contas.forEach((conta: any) => {
      const mid = conta.mercado_id;
      if (!mid) return;
      if (!contasPorMercado[mid]) {
        contasPorMercado[mid] = { clientes: new Set(), contas: 0 };
      }
      contasPorMercado[mid].clientes.add(cliente.id);
      contasPorMercado[mid].contas++;
    });
  });

  Object.entries(contasPorMercado).forEach(([mid, data]) => {
    const market = mercadoMap.get(mid);
    clientesPorMercado.push({
      nome: market?.nome ?? mid.substring(0, 8),
      clientes: data.clientes.size,
      contas: data.contas,
    });
  });
  clientesPorMercado.sort((a, b) => b.clientes - a.clientes);

  // ─── Client counts by province ───
  const clientesPorProvincia: { nome: string; clientes: number; contas: number }[] = [];
  const mercadosPorProvincia: Record<string, string[]> = {};
  mercados.forEach((m: any) => {
    if (!mercadosPorProvincia[m.provincia]) mercadosPorProvincia[m.provincia] = [];
    mercadosPorProvincia[m.provincia].push(m.id);
  });

  Object.entries(mercadosPorProvincia).forEach(([provincia, mIds]) => {
    let totalClientes = 0;
    let totalContas = 0;
    const clientesSet = new Set<string>();
    mIds.forEach((mid) => {
      const data = contasPorMercado[mid];
      if (data) {
        data.clientes.forEach((cid) => clientesSet.add(cid));
        totalContas += data.contas;
      }
    });
    clientesPorProvincia.push({
      nome: provincia,
      clientes: clientesSet.size,
      contas: totalContas,
    });
  });
  clientesPorProvincia.sort((a, b) => b.clientes - a.clientes);

  const CORES_GRAFICO = ["#e91e63", "#9c27b0", "#3f51b5", "#009688", "#ff5722", "#ff9800", "#795548", "#607d8b", "#4caf50", "#f44336"];

  // Markets filtered by province (for dropdown)
  const mercadosDropdown = filtroProvincia === "todas"
    ? mercados
    : mercados.filter((m: any) => m.provincia === filtroProvincia);

  // Filter clients by search + province + market
  const filteredClientes = clientes.filter((c: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      c.nome.toLowerCase().includes(q) ||
      c.bi.toLowerCase().includes(q) ||
      c.telefone?.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const contas = c.accounts ?? [];

    // Province filter: check if any account is in a market of the selected province
    if (filtroProvincia !== "todas") {
      const hasAccountInProvincia = contas.some((conta: any) => {
        const market = mercados.find((m: any) => m.id === conta.mercado_id);
        return market?.provincia === filtroProvincia;
      });
      if (!hasAccountInProvincia) return false;
    }

    // Market filter: check if any account is in the selected market
    if (filtroMercado !== "todos") {
      const hasAccountInMercado = contas.some(
        (conta: any) => conta.mercado_id === filtroMercado,
      );
      if (!hasAccountInMercado) return false;
    }

    return true;
  });

  // ─── Edit handlers ───
  function openEdit(cliente: any) {
    setEditCliente(cliente);
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
    if (!editCliente) return;
    setEditPending(true);
    setEditError("");

    const formData = new FormData();
    formData.set("cliente_id", editCliente.id);
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
    setResult({ success: "Cliente actualizado com sucesso!" });
    setRefreshKey((k) => k + 1);
    setEditPending(false);
  }

  // ─── Delete handlers ───
  function openDelete(clienteId: string) {
    setDeleteTarget(clienteId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeletePending(true);

    const res = await adminEliminarCliente(deleteTarget);
    if (res.error) {
      setResult({ error: res.error });
    } else {
      setResult({ success: "Cliente eliminado com sucesso!" });
    }

    setDeleteOpen(false);
    setDeletePending(false);
    setRefreshKey((k) => k + 1);
  }

  // ─── Create account handlers ───
  async function openCreate(clienteId: string) {
    setCreateClienteId(clienteId);
    setCreateForm({
      banqueiro_id: "",
      pacote: PACOTES[0] as string,
      mercado_id: "",
    });
    setCreateError("");

    // Load banqueiros and mercados for the form
    const { data: bankeirosData } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("papel", "banqueiro")
      .eq("ativo", true)
      .order("nome");

    setBankeiros(bankeirosData ?? []);

    const { data: mercadosData } = await supabase
      .from("markets")
      .select("id, nome, provincia")
      .order("nome");

    setMercados(mercadosData ?? []);

    setCreateOpen(true);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreatePending(true);
    setCreateError("");

    const formData = new FormData();
    formData.set("cliente_id", createClienteId);
    formData.set("banqueiro_id", createForm.banqueiro_id);
    formData.set("pacote", createForm.pacote);
    formData.set("mercado_id", createForm.mercado_id);

    const res = await adminCriarConta(formData);
    if (res.error) {
      setCreateError(res.error);
      setCreatePending(false);
      return;
    }

    setCreateOpen(false);
    setResult({ success: "Conta criada com sucesso!" });
    setRefreshKey((k) => k + 1);
    setCreatePending(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Administração Global
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Gestão de Clientes
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Visualize, edite, elimine e crie contas para clientes em todo o sistema.
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clientes", value: totalClientes, icon: Users, color: "text-bci-navy bg-bci-navySoft" },
          { label: "Total Contas", value: totalContas, icon: CreditCard, color: "text-bci-magenta bg-bci-magenta/10" },
          { label: "Contas Abertas", value: contasAbertas, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "TPA's Entregues", value: tpasEntregues, icon: Smartphone, color: "text-blue-600 bg-blue-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color} mb-3`}>
              <item.icon size={20} />
            </div>
            <p className="text-2xl font-extrabold text-bci-ink">{item.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-bci-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Stats second row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Contas Pendentes", value: contasPendentes, color: "text-amber-600 bg-amber-50" },
          { label: "TPA's Pendentes", value: tpasPendentes, color: "text-red-600 bg-red-50" },
          { label: "Classes Vendidas", value: classesData.length, color: "text-purple-600 bg-purple-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-bci-line bg-white p-4 shadow-card">
            <p className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${item.color} mb-1.5`}>
              {item.value}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-bci-muted">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes distribution */}
        {classesData.length > 0 && (
          <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <BarChart3 size={16} />
              </div>
              <div>
                <p className="font-extrabold text-sm text-bci-ink">Distribuição por Classe</p>
                <p className="text-xs text-bci-muted">Total de {totalContas} contas</p>
              </div>
            </div>
            <div className="h-40 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classesData.map((c, i) => ({ ...c, color: CORES_GRAFICO[i % CORES_GRAFICO.length] }))}
                    cx="50%" cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="valor"
                    nameKey="nome"
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {classesData.map((_, index) => (
                      <Cell key={index} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2">
              {classesData.map((c) => {
                const pct = totalContas > 0 ? Math.round((c.valor / totalContas) * 100) : 0;
                return (
                  <div key={c.nome} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-bold text-bci-ink">{c.nome}</span>
                    <span className="text-bci-muted">{c.valor} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clientes por Mercado */}
        {clientesPorMercado.length > 0 && (
          <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Store size={16} />
              </div>
              <div>
                <p className="font-extrabold text-sm text-bci-ink">Clientes por Mercado</p>
                <p className="text-xs text-bci-muted">Distribuição de clientes pelos mercados</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientesPorMercado} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="clientes" name="Clientes" fill="#e91e63" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="contas" name="Contas" fill="#0f4a8a" radius={[4, 4, 0, 0]} animationBegin={150} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Clientes por Província */}
      {clientesPorProvincia.length > 0 && (
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin size={16} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-bci-ink">Clientes por Província</p>
              <p className="text-xs text-bci-muted">Distribuição geográfica dos clientes</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientesPorProvincia} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="clientes" name="Clientes" fill="#0f4a8a" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={800} animationEasing="ease-out" />
                <Bar dataKey="contas" name="Contas" fill="#e91e63" radius={[4, 4, 0, 0]} animationBegin={150} animationDuration={800} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-bci-line bg-white">
        <MapPin size={16} className="text-bci-navy flex-shrink-0" />
        <span className="text-sm font-bold text-bci-ink flex-shrink-0">Filtrar por:</span>

        <ProvinciaSelect
          value={filtroProvincia}
          onChange={(e) => {
            setFiltroProvincia(e.target.value);
            setFiltroMercado("todos");
          }}
          placeholder="Todas as províncias"
          className="px-4 py-2 text-sm focus:border-bci-navy"
          aria-label="Filtrar por província"
        />

        <select
          value={filtroMercado}
          onChange={(e) => setFiltroMercado(e.target.value)}
          className="rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-medium outline-none focus:border-bci-navy"
          aria-label="Filtrar por mercado"
        >
          <option value="todos">Todos os mercados</option>
          {mercadosDropdown.map((m: any) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-bci-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar nome, BI ou telefone..."
            className="pl-9 w-full sm:w-64 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
          />
        </div>
      </div>

      {/* Clients table */}
      {loading ? (
        <div className="py-20 text-center text-sm text-bci-muted">A carregar clientes...</div>
      ) : filteredClientes.length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-20 text-center shadow-card">
          <Users className="mx-auto h-10 w-10 text-bci-muted" />
          <p className="mt-4 text-sm font-bold text-bci-muted">
            {search ? "Nenhum resultado encontrado." : "Nenhum cliente registado."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">BI</th>
                  <th className="hidden sm:table-cell px-4 py-3">Contacto</th>
                  <th className="px-4 py-3 text-center">Contas</th>
                  <th className="hidden md:table-cell px-4 py-3">Abertas</th>
                  <th className="px-4 py-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente: any) => {
                  const contas = cliente.accounts ?? [];
                  const abertas = contas.filter((a: any) => a.status === "aberta").length;
                  return (
                    <tr key={cliente.id} className="border-t border-bci-line hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clientes/${cliente.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-bci-ink hover:text-bci-navy transition-colors group"
                        >
                          {cliente.nome}
                          <ExternalLink size={12} className="text-bci-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-bci-muted">{cliente.bi}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-bci-muted">{cliente.telefone ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-bci-magenta">{contas.length}</td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          abertas === contas.length
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {abertas}/{contas.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCreate(cliente.id)}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Criar conta"
                          >
                            <UserPlus size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(cliente)}
                            className="rounded-lg bg-amber-50 p-1.5 text-amber-600 hover:bg-amber-600 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => openDelete(cliente.id)}
                            className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-bci-line text-xs text-bci-muted">
            Mostrando {filteredClientes.length} de {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* ──────── Edit Dialog ──────── */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bci-dark flex items-center gap-2">
              <Pencil size={18} className="text-amber-600" />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>
          {editError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{editError}</div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <label className="text-sm font-bold text-bci-ink">
              Nome completo
              <input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              BI
              <input value={editForm.bi} onChange={(e) => setEditForm({ ...editForm, bi: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              Telefone
              <input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
            </label>
            <label className="text-sm font-bold text-bci-ink">
              Endereço
              <input value={editForm.endereco} onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-bold text-bci-ink">
                Emissão BI
                <input type="date" value={editForm.bi_emissao} onChange={(e) => setEditForm({ ...editForm, bi_emissao: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
              </label>
              <label className="text-sm font-bold text-bci-ink">
                Validade BI
                <input type="date" value={editForm.bi_validade} onChange={(e) => setEditForm({ ...editForm, bi_validade: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft" />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={editPending}
                className="flex-1 rounded-xl bg-bci-navy px-4 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors disabled:opacity-60">
                <Save size={16} className="inline mr-1" />{editPending ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────── Delete Dialog ──────── */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-bci-dark flex items-center gap-2">
              <Trash2 size={18} className="text-red-600" />
              Confirmar Eliminação
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-bci-muted">
            Tem a certeza que deseja eliminar este cliente e todas as suas contas? Esta acção não pode ser desfeita.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setDeleteOpen(false)}
              className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
            <button onClick={handleDeleteConfirm} disabled={deletePending}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
              {deletePending ? "A eliminar..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────── Create Account Dialog ──────── */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-bci-dark flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-600" />
              Criar Nova Conta
            </DialogTitle>
          </DialogHeader>
          {createError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{createError}</div>
          )}
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <p className="text-sm text-bci-muted">
              Criar uma nova conta para este cliente. A conta será criada como <strong>pendente</strong>.
            </p>

            <div className="space-y-4">
              <label className="text-sm font-bold text-bci-ink">
                Bankeiro Responsável *
                <select
                  value={createForm.banqueiro_id}
                  onChange={(e) => setCreateForm({ ...createForm, banqueiro_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white"
                >
                  <option value="">Seleccione um Bankeiro</option>
                  {bankeiros.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-bold text-bci-ink">
                Mercado *
                <select
                  value={createForm.mercado_id}
                  onChange={(e) => setCreateForm({ ...createForm, mercado_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white"
                >
                  <option value="">Seleccione um Mercado</option>
                  {mercados.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.provincia})</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-bold text-bci-ink">
                Classe *
                <select
                  value={createForm.pacote}
                  onChange={(e) => setCreateForm({ ...createForm, pacote: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white"
                >
                  {PACOTES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="flex-1 rounded-xl border border-bci-line px-4 py-3 text-sm font-extrabold text-bci-muted hover:bg-bci-bg transition-colors">Cancelar</button>
              <button type="submit" disabled={createPending}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <Plus size={16} />
                {createPending ? "A criar..." : "Criar Conta"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
