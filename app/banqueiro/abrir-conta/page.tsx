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
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  bi: z.string().min(5, "BI inválido"),
  biEmissao: z.string().optional(),
  biValidade: z.string().optional(),
  telefone: z.string().min(9, "Telefone inválido"),
  endereco: z.string().optional(),
  pacote: z.string().min(1, "Selecione uma classe"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AbrirConta() {
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState({
    biValidator: false,
    documentStorage: false,
    banking: false,
  });
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      bi: "",
      biEmissao: "",
      biValidade: "",
      telefone: "",
      endereco: "",
      pacote: PACOTES[0] as string,
    },
  });

  // Verificar integrações disponíveis ao montar o componente
  useEffect(() => {
    let ignore = false;
    const integrations = {
      biValidator: registry.getBiValidator() !== null,
      documentStorage: registry.getDocumentStorage() !== null,
      banking: registry.getBankingIntegration() !== null,
    };
    setIntegrations(integrations);
    return () => { ignore = true; };
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
    return null;
  };

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

  const handleBiBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const biValue = e.target.value;
    if (!biValue || biValue.length < 5) return;

    const data = await validateBiWithIntegrations(biValue);
    if (data?.nome) {
      form.setValue("nome", form.getValues("nome") || data.nome || "");
      form.setValue("endereco", form.getValues("endereco") || data.endereco || "");
      toast.success("Dados preenchidos via validador de BI!");
    }
  };

  const onSubmit = async (values: FormValues) => {
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

      // Integração Bancária (se activa)
      const bankingResult = await submitToBankingIntegration({
        nome: values.nome,
        bi: values.bi,
        telefone: values.telefone,
        endereco: values.endereco || "",
        pacote: values.pacote,
        banqueiroCodigo: profile.codigo_interno,
        balcao: profile.local_id ?? "",
      });

      if (bankingResult.submitted) {
        toast.success("Conta registada com sucesso através do sistema bancário!");
        router.push("/banqueiro/clientes");
        return;
      }

      // Fallback: fluxo manual
      let clienteId: string;
      const { data: existingClient } = await supabase
        .from("clientes")
        .select("id")
        .eq("bi", values.bi)
        .maybeSingle();

      const clientePayload = {
        nome: values.nome,
        telefone: values.telefone,
        endereco: values.endereco || null,
        bi_emissao: values.biEmissao || null,
        bi_validade: values.biValidade || null,
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
          .insert({ bi: values.bi, ...clientePayload })
          .select("id")
          .single();
        if (clientError) throw clientError;
        clienteId = newClient.id;
      }

      const agora = new Date();
      const { error: accountError } = await supabase.from("accounts").insert({
        banqueiro_id: profile.id,
        cliente_id: clienteId,
        pacote: values.pacote,
        mercado_id: profile.local_id,
        tpa_status: "pendente",
        status: "pendente",
        hora_abertura: agora.toTimeString().slice(0, 8),
      });
      if (accountError) throw accountError;

      toast.success("Conta registada como pendente! Active-a no painel de Clientes.");
      router.push("/banqueiro/clientes");
    } catch (error: any) {
      toast.error("Erro ao abrir conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveIntegrations = Object.values(integrations).some(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
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
          <CardDescription className="text-white/80">
            A conta é criada como <b>pendente</b> — active-a depois em &quot;Meus Clientes&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Dados do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do BI</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 000000000LA000" 
                            {...field} 
                            onBlur={(e) => {
                              field.onBlur();
                              handleBiBlur(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {integrations.biValidator && (
                          <FormDescription className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <Cpu size={10} />
                            Validação automática ao sair deste campo
                          </FormDescription>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="biEmissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão do BI</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="biValidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Validade do BI</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex.: 923 123 456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">Classes</h3>
                <FormField
                  control={form.control}
                  name="pacote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma classe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PACOTES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        O TPA fica automaticamente como <b>pendente</b> — pode alterá-lo para &quot;entregue&quot; depois, no painel de Clientes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
