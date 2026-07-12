"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PACOTES } from "@/lib/types";
import { registry } from "@/lib/integrations/registry";
import { Cpu } from "lucide-react";

export default function AbrirConta() {
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState({
    biValidator: false,
    documentStorage: false,
    banking: false,
  });
  const router = useRouter();

  // Verificar integrações disponíveis ao montar o componente
  useEffect(() => {
    let ignore = false;
    const integrations = {
      biValidator: registry.getBiValidator() !== null,
      documentStorage: registry.getDocumentStorage() !== null,
      banking: registry.getBankingIntegration() !== null,
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntegrations(integrations);
    return () => { ignore = true; };
  }, []);

  const [formData, setFormData] = useState({
    nome: "",
    bi: "",
    biEmissao: "",
    biValidade: "",
    telefone: "",
    endereco: "",
    pacote: PACOTES[0] as string,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  /**
   * Valida o BI usando o registry (se disponível).
   * Se não houver validador activo, retorna null (comportamento actual).
   */
  const validateBiWithIntegrations = async (
    biNumber: string,
  ): Promise<{ nome?: string; endereco?: string } | null> => {
    const validator = registry.getBiValidator();
    if (!validator?.isAvailable()) return null;

    const result = await validator.execute({ biNumber });
    if (result.success) {
      return {
        nome: result.data.nome,
        endereco: result.data.endereco,
      };
    }
    // Se falhar mas tiver fallback, o sistema continua manualmente
    return null;
  };

  /**
   * Se houver integração bancária activa, submete o processo ao banco.
   * Caso contrário, mantém o comportamento actual (criação local).
   */
  const submitToBankingIntegration = async (
    accountData: {
      nome: string;
      bi: string;
      telefone: string;
      endereco: string;
      pacote: string;
      banqueiroCodigo: string;
      balcao: string;
    },
  ): Promise<{ submitted: boolean }> => {
    const banking = registry.getBankingIntegration();
    if (!banking?.isAvailable()) return { submitted: false };

    const result = await banking.execute({
      cliente: {
        nome: accountData.nome,
        bi: accountData.bi,
        telefone: accountData.telefone,
        endereco: accountData.endereco,
      },
      pacote: accountData.pacote,
      balcao: accountData.balcao,
      banqueiroCodigo: accountData.banqueiroCodigo,
    });

    return { submitted: result.success };
  };

  /**
   * Lida com o blur do campo BI: se houver validador activo,
   * tenta preencher automaticamente nome e endereço.
   */
  const handleBiBlur = async () => {
    if (!formData.bi || formData.bi.length < 5) return;

    const data = await validateBiWithIntegrations(formData.bi);
    if (data?.nome) {
      setFormData((prev) => ({
        ...prev,
        nome: prev.nome || data.nome || "",
        endereco: prev.endereco || data.endereco || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, local_id, codigo_interno")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Perfil não encontrado");

      // ─ Integração Bancária (se activa) ─
      const bankingResult = await submitToBankingIntegration({
        nome: formData.nome,
        bi: formData.bi,
        telefone: formData.telefone,
        endereco: formData.endereco,
        pacote: formData.pacote,
        banqueiroCodigo: profile.codigo_interno,
        balcao: profile.local_id ?? "",
      });

      if (bankingResult.submitted) {
        // A integração tratou do registo; não precisamos criar localmente
        alert("Conta registada com sucesso através do sistema bancário!");
        router.push("/banqueiro/clientes");
        return;
      }

      // ─ Fallback: fluxo manual actual ─
      // Cliente (upsert por BI)
      let clienteId: string;
      const { data: existingClient } = await supabase
        .from("clientes")
        .select("id")
        .eq("bi", formData.bi)
        .single();

      const clientePayload = {
        nome: formData.nome,
        telefone: formData.telefone,
        endereco: formData.endereco,
        bi_emissao: formData.biEmissao || null,
        bi_validade: formData.biValidade || null,
      };

      if (existingClient) {
        clienteId = existingClient.id;
        await supabase
          .from("clientes")
          .update(clientePayload)
          .eq("id", clienteId);
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from("clientes")
          .insert({ bi: formData.bi, ...clientePayload })
          .select("id")
          .single();
        if (clientError) throw clientError;
        clienteId = newClient.id;
      }

      // Conta entra sempre como pendente, com hora de abertura
      const agora = new Date();
      const { error: accountError } = await supabase.from("accounts").insert({
        banqueiro_id: profile.id,
        cliente_id: clienteId,
        pacote: formData.pacote,
        mercado_id: profile.local_id,
        tpa_status: "pendente",
        status: "pendente",
        hora_abertura: agora.toTimeString().slice(0, 8),
      });
      if (accountError) throw accountError;

      alert(
        "Conta registada como pendente! Active-a no painel de Clientes quando estiver pronta.",
      );
      router.push("/banqueiro/clientes");
    } catch (error: any) {
      alert("Erro ao abrir conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Determina se alguma integração está activa
  const hasActiveIntegrations = Object.values(integrations).some(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Banner informativo quando há integrações activas */}
      {hasActiveIntegrations && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Cpu size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Integrações activas
            </p>
            <ul className="text-xs text-emerald-700 mt-1 space-y-0.5">
              {integrations.biValidator && (
                <li>• Validação automática de BI activa</li>
              )}
              {integrations.documentStorage && (
                <li>• Upload de documentos disponível</li>
              )}
              {integrations.banking && (
                <li>• Integração com sistema bancário activa</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="bg-bci-dark text-white rounded-t-xl">
          <CardTitle className="text-2xl">Abrir Nova Conta</CardTitle>
          <CardDescription className="text-white/80">              A conta é criada como <b>pendente</b> — active-a depois em &quot;Meus
            Clientes&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bi">Número do BI</Label>
                  <Input
                    id="bi"
                    required
                    value={formData.bi}
                    onChange={(e) =>
                      setFormData({ ...formData, bi: e.target.value })
                    }
                    onBlur={handleBiBlur}
                  />
                  {integrations.biValidator && (
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <Cpu size={10} />
                      Validação automática ao sair deste campo
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biEmissao">Data de Emissão do BI</Label>
                  <Input
                    id="biEmissao"
                    type="date"
                    value={formData.biEmissao}
                    onChange={(e) =>
                      setFormData({ ...formData, biEmissao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biValidade">Data de Validade do BI</Label>
                  <Input
                    id="biValidade"
                    type="date"
                    value={formData.biValidade}
                    onChange={(e) =>
                      setFormData({ ...formData, biValidade: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    required
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    placeholder="Ex.: 923 123 456"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold border-b pb-2">Classes</h3>
              <div className="space-y-2">
                <Label htmlFor="pacote">Classe</Label>
                <Select
                  value={formData.pacote}
                  onValueChange={(val) =>
                    setFormData({ ...formData, pacote: val || formData.pacote })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACOTES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500">
                O TPA fica automaticamente como <b>pendente</b> — pode alterá-lo                para &quot;entregue&quot; depois, no painel de Clientes.</p>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-bci-magenta hover:bg-bci-magenta/90 text-white py-6 text-lg"
              >
                {loading ? "A processar..." : "Registar Conta (Pendente)"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
