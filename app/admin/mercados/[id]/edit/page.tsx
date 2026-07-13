import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { markets as mockMarkets } from "@/lib/mock-data";
import { MarketForm } from "@/components/market-form";
import type { Market } from "@/lib/types";

export default async function EditarMercadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let market: Market | null = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("markets")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      market = {
        id: data.id,
        nome: data.nome,
        provincia: data.provincia,
        tipo: data.tipo,
        balcao: data.balcao ?? undefined,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        raioMetros: Number(data.raio_metros),
      };
    }
  } else {
    market = mockMarkets.find((m) => m.id === id) ?? null;
  }

  if (!market) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link
        href={`/admin/mercados/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-navy transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao dashboard
      </Link>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Mercados
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Editar Mercado
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          A editar: <strong>{market.nome}</strong>
        </p>
      </div>

      <MarketForm market={market} />
    </div>
  );
}
