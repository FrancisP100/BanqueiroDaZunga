"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";
import { CreditCard, MapPin, Phone, Calendar } from "lucide-react";

export default function InspecionarBanqueiro() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [banqueiro, setBanqueiro] = useState<any>(null);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    console.log("🔄 loadData iniciado - ID:", id);

    if (!id) {
      setError("ID do banqueiro não encontrado nos parâmetros.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const start = Date.now();

      const [profileRes, presRes, accsRes] = await Promise.all([
        supabase.from("profiles").select("*, markets(nome, provincia)").eq("id", id).single(),
        supabase.from("presences").select("*").eq("profile_id", id).order("data", { ascending: false }).limit(30),
        supabase.from("accounts").select("id, pacote, status, tpa_status, created_at, hora_abertura, clientes(nome, bi)").eq("banqueiro_id", id).order("created_at", { ascending: false }),
      ]);

      const duration = Date.now() - start;

      setDebugInfo({
        profile: profileRes,
        presencesCount: presRes.data?.length ?? 0,
        accountsCount: accsRes.data?.length ?? 0,
        duration
      });

      if (profileRes.error) {
        throw new Error(`Erro no perfil: ${profileRes.error.message}`);
      }

      setBanqueiro(profileRes.data);
      setPresencas(presRes.data ?? []);
      setContas(accsRes.data ?? []);

      console.log("✅ Dados carregados com sucesso");
    } catch (err: any) {
      console.error("❌ Erro no loadData:", err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    console.log("📌 useEffect executado - ID:", id);
    loadData();
  }, [loadData]);

  // ====================== UI ======================
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="text-bci-muted">A carregar banqueiro...</div>
        <div className="text-xs text-gray-400 mt-2">ID: {id || "undefined"}</div>
      </div>
    );
  }

  if (error || !banqueiro) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <p className="text-red-600 font-medium mb-4">{error || "Bankeiro não encontrado"}</p>
        <pre className="text-left text-xs bg-gray-100 p-4 rounded overflow-auto mb-4">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-bci-blue text-white rounded-xl hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ... resto do return (tabelas) igual ao anterior
  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;
  const totalClientes = contas.filter((c) => c.clientes?.nome).length;

  return (
    <div className="space-y-8">
      {/* Header + Stats + Tabelas — podes colar aqui o teu return anterior */}
      {/* Para agilizar, usa o return da versão anterior que te enviei */}
    </div>
  );
}