"use client";

import { useEffect, useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserCircle,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ativarConta, atualizarTpaStatus } from "@/app/banqueiro/actions";

export default function GestaoClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    loadClientes();
  }, []);

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

  const filteredClientes = clientes.filter(
    (c) =>
      c.bi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleAtivar(contaId: string) {
    startTransition(async () => {
      const result = await ativarConta(contaId);
      if (result.error) alert(result.error);
      else {
        await loadClientes();
      }
    });
  }

  function handleTpa(contaId: string, status: "pendente" | "entregue") {
    startTransition(async () => {
      const result = await atualizarTpaStatus(contaId, status);
      if (result.error) alert(result.error);
      else await loadClientes();
    });
  }

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
                        className="border-t border-bci-line hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => setSelectedCliente(cliente)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-bci-magenta/10 p-2 rounded-full text-bci-magenta flex-shrink-0">
                              <UserCircle size={18} />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {cliente.nome}
                            </span>
                          </div>
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
                        <td className="px-4 py-3">
                          <span className="text-xs text-bci-muted hover:text-bci-magenta font-medium">
                            Detalhes →
                          </span>
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

      <Dialog
        open={!!selectedCliente}
        onOpenChange={(open) => !open && setSelectedCliente(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedCliente && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-bci-dark border-b pb-4">
                  Detalhes do Cliente
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  <UserCircle className="text-bci-magenta" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Nome Completo</p>
                    <p className="font-medium">{selectedCliente.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="text-bci-magenta" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">BI</p>
                    <p className="font-medium">{selectedCliente.bi}</p>
                    <p className="text-xs text-gray-400">
                      Emissão: {selectedCliente.bi_emissao ?? "—"} · Validade:{" "}
                      {selectedCliente.bi_validade ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-bci-magenta" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Contacto</p>
                    <p className="font-medium">{selectedCliente.telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-bci-magenta" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="font-medium">{selectedCliente.endereco}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold text-lg mb-3">
                    Histórico de Contas
                  </h4>
                  <div className="space-y-3">
                    {selectedCliente.contas.map((conta: any) => (
                      <div
                        key={conta.id}
                        className="bg-gray-50 p-3 rounded-lg text-sm space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{conta.pacote}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(conta.data).toLocaleDateString()}{" "}
                              {conta.horaAbertura
                                ? `às ${String(conta.horaAbertura).slice(0, 5)}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${conta.status === "aberta" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                          >
                            {conta.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">TPA:</span>
                            <button
                              disabled={isPending}
                              onClick={() =>
                                handleTpa(
                                  conta.id,
                                  conta.tpaStatus === "entregue"
                                    ? "pendente"
                                    : "entregue",
                                )
                              }
                              className={`text-xs font-bold px-2 py-1 rounded-full ${conta.tpaStatus === "entregue" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {conta.tpaStatus === "entregue"
                                ? "Entregue ✓"
                                : "Pendente — marcar como entregue"}
                            </button>
                          </div>
                          {conta.status === "pendente" && (
                            <button
                              disabled={isPending}
                              onClick={() => handleAtivar(conta.id)}
                              className="flex items-center gap-1 text-xs font-bold text-white bg-bci-magenta px-3 py-1.5 rounded-full hover:bg-bci-magenta/90"
                            >
                              <CheckCircle2 size={14} /> Activar conta
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
