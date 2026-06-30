"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";
import { CreditCard, MapPin, Phone, Calendar } from "lucide-react";

export default function InspecionarBanqueiro() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id; // mais seguro

  const [loading, setLoading] = useState(true);
  const [banqueiro, setBanqueiro] = useState<any>(null);
  const [presencas, setPresencas] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadData = useCallback(async () => {
    if (!id || typeof id !== "string") {
      setError(`ID inválido ou ausente. Recebido: ${JSON.stringify(params?.id)}`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileRes, presRes, accsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, markets(nome, provincia)")
          .eq("id", id)
          .single(),
        supabase
          .from("presences")
          .select("*")
          .eq("profile_id", id)
          .order("data", { ascending: false })
          .limit(30),
        supabase
          .from("accounts")
          .select("id, pacote, status, tpa_status, created_at, hora_abertura, clientes(nome, bi)")
          .eq("banqueiro_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;

      setBanqueiro(profileRes.data);
      setPresencas(presRes.data ?? []);
      setContas(accsRes.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [id, supabase, params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="py-20 text-center text-bci-muted">A carregar...</div>;

  if (error || !banqueiro) {
    return (
      <div className="py-20 text-center text-red-600">
        <p>{error}</p>
        <p className="text-sm mt-2 text-gray-500">ID recebido: {id || "undefined"}</p>
        <button onClick={loadData} className="mt-6 underline">Recarregar</button>
      </div>
    );
  }

  // ... resto do teu return (header, stats, tabelas) fica igual
  const contasAbertas = contas.filter((c) => c.status === "aberta").length;
  const contasPendentes = contas.filter((c) => c.status === "pendente").length;
  const tpaEntregues = contas.filter((c) => c.tpa_status === "entregue").length;
  const totalClientes = contas.filter((c) => c.clientes?.nome).length;

  return (
    <div className="space-y-8">
      {/* Coloca aqui o teu código do return original (header + cards + tabelas) */}
    </div>
  );
}