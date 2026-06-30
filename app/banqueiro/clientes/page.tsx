"use client";

import { useEffect, useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent } from "@/components/ui/card";
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
      setClientes(Array.from(clientMap.values()));
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

      <Card>
        <CardContent className="p-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClientes.map((cliente) => {
                const pendentes = cliente.contas.filter(
                  (c: any) => c.status === "pendente",
                ).length;
                return (
                  <div
                    key={cliente.id}
                    className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => setSelectedCliente(cliente)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-bci-magenta/10 p-3 rounded-full text-bci-magenta">
                        <UserCircle size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {cliente.nome}
                        </h3>
                        <p className="text-sm text-gray-500">
                          BI: {cliente.bi}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex justify-between border-t pt-3 mt-2">
                      <span>
                        Contas:{" "}
                        <strong className="text-bci-magenta">
                          {cliente.contas.length}
                        </strong>
                      </span>
                      {pendentes > 0 && (
                        <span className="text-amber-600 font-semibold">
                          {pendentes} pendente(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
