"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from "@/components/ui/input";
import {
  Search,
  UserCircle,
  ArrowRight,
} from "lucide-react";

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteCount, setClienteCount] = useState(0);

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

  const filteredClientes = clientes.filter(
    (c) =>
      c.bi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
            <div className="overflow-hidden rounded-xl border border-bci-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">BI</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Contas</th>
                    <th className="px-4 py-3">Pendentes</th>
                    <th className="px-4 py-3"></th>
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
                        <td className="px-4 py-3">
                          <Link
                            href={`/banqueiro/clientes/${cliente.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="bg-bci-magenta/10 p-2 rounded-full text-bci-magenta flex-shrink-0">
                              <UserCircle size={18} />
                            </div>
                            <span className="font-semibold text-gray-900 hover:text-bci-magenta transition-colors">
                              {cliente.nome}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-bci-muted">{cliente.bi}</td>
                        <td className="px-4 py-3 text-bci-muted">{cliente.telefone}</td>
                        <td className="px-4 py-3 font-bold text-bci-magenta">
                          {cliente.contas.length}
                        </td>
                        <td className="px-4 py-3">
                          {pendentes > 0 ? (
                            <span className="text-amber-600 font-semibold text-xs">
                              {pendentes} pendente(s)
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-medium">
                              Todas activas
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/banqueiro/clientes/${cliente.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-bci-muted hover:text-bci-magenta transition-colors"
                          >
                            Detalhes <ArrowRight size={14} />
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
