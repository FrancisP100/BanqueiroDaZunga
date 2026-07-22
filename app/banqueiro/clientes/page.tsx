"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from "@/components/ui/input";
import {
  Search,
  UserCircle,
  ArrowRight,
  Smartphone,
  X,
} from "lucide-react";

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteCount, setClienteCount] = useState(0);
  const [filtroNoBalcao, setFiltroNoBalcao] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const loadClientes = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!profile) return;

    const { data: accounts } = await supabase
      .from("accounts")
      .select(
        `
        id, pacote, status, tpa_status, hora_abertura, created_at,
        clientes ( id, bi, nome, telefone, endereco, bi_emissao, bi_validade )
      `,
      )
      .eq("banqueiro_id", profile.id)
      .order("created_at", { ascending: false });

    if (accounts) {
      const clientMap = new Map();
      accounts.forEach((acc: any) => {
        if (!acc.clientes) return;
        const cId = acc.clientes.id;
        if (!clientMap.has(cId))
          clientMap.set(cId, { ...acc.clientes, contas: [] });
        clientMap.get(cId).contas.push({
          id: acc.id,
          pacote: acc.pacote,
          status: acc.status,
          tpaStatus: acc.tpa_status,
          horaAbertura: acc.hora_abertura,
          data: acc.created_at,
        });
      });
      // Ordenar clientes alfabeticamente por nome
      setClientes(
        Array.from(clientMap.values()).sort((a: any, b: any) =>
          a.nome.localeCompare(b.nome, "pt"),
        ),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClientes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noBalcaoCount = clientes.filter((c) =>
    c.contas.some((conta: any) => conta.tpaStatus === "no_balcao"),
  ).length;

  const filteredClientes = clientes.filter((c) => {
    // Search filter
    if (
      searchTerm &&
      !c.bi.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    // TPA no balcão filter
    if (filtroNoBalcao) {
      return c.contas.some((conta: any) => conta.tpaStatus === "no_balcao");
    }
    return true;
  });

  // Número total de clientes para o header
  useEffect(() => {
    if (clientes.length > 0 && clienteCount === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClienteCount(clientes.length);
    }
  }, [clientes, clienteCount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-bci-dark">Gestão de Clientes</h1>
        <p className="text-gray-500">
          Acompanhe a sua carteira de clientes e active as contas pendentes
        </p>
      </div>

      <div className="rounded-2xl border border-bci-line bg-white shadow-card">
        <div className="p-6">
          {/* Filtro rápido: TPA no balcão */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => setFiltroNoBalcao(!filtroNoBalcao)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                filtroNoBalcao
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-bci-line text-bci-muted hover:shadow-sm hover:-translate-y-0.5"
              }`}
            >
              <Smartphone size={15} />
              TPA no Balcão
              {noBalcaoCount > 0 && (
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ml-0.5 ${
                  filtroNoBalcao
                    ? "bg-white/25 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {noBalcaoCount}
                </span>
              )}
              {filtroNoBalcao && (
                <X size={14} className="ml-0.5" />
              )}
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Pesquisar por BI ou Nome..."
              className="pl-10 h-12 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              A carregar clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-bci-line">
              {/* Versão tabela — esconde colunas menos importantes em mobile */}
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-3 sm:px-4 py-3">Cliente</th>
                    <th className="px-3 sm:px-4 py-3">BI</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 py-3">Contacto</th>
                    <th className="px-3 sm:px-4 py-3 text-center">Contas</th>
                    <th className="hidden md:table-cell px-3 sm:px-4 py-3">Pendentes</th>
                    <th className="px-3 sm:px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((cliente) => {
                    const pendentes = cliente.contas.filter(
                      (c: any) => c.status === "pendente",
                    ).length;
                    return (
                      <tr
                        key={cliente.id}
                        className="border-t border-bci-line hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <Link
                            href={`/banqueiro/clientes/${cliente.id}`}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="bg-bci-magenta/10 p-1.5 sm:p-2 rounded-full text-bci-magenta flex-shrink-0">
                              <UserCircle size={16} className="sm:size-[18px]" />
                            </div>
                            <span className="font-semibold text-gray-900 hover:text-bci-magenta transition-colors text-xs sm:text-sm leading-tight">
                              {cliente.nome}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-bci-muted text-xs sm:text-sm">{cliente.bi}</td>
                        <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-bci-muted">{cliente.telefone}</td>
                        <td className="px-3 sm:px-4 py-3 font-bold text-bci-magenta text-center">
                          {cliente.contas.length}
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-4 py-3">
                          {cliente.contas.some((c: any) => c.tpaStatus === "no_balcao") ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 whitespace-nowrap">
                              <Smartphone size={10} />
                              No Balcão
                            </span>
                          ) : pendentes > 0 ? (
                            <span className="text-amber-600 font-semibold text-xs">
                              {pendentes}
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-medium">
                              ✓
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right">
                          <Link
                            href={`/banqueiro/clientes/${cliente.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-bci-muted hover:text-bci-magenta transition-colors whitespace-nowrap"
                          >
                            <span className="hidden sm:inline">Detalhes</span>
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Clique em qualquer cliente para ver detalhes e gerir contas */}
    </div>
  );
}
