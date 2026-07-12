import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { markets as mockMarkets } from "@/lib/mock-data";
import { MarketDashboard } from "@/components/market-dashboard";
import type { Market } from "@/lib/types";

export default async function MercadoDashboardPage({
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
    <div className="space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-bci-muted">
        <a href="/admin/mercados" className="hover:text-bci-magenta transition-colors">
          Mercados
        </a>
        <span>/</span>
        <span className="text-bci-ink">{market.nome}</span>
      </div>

      <MarketDashboard market={market} />
    </div>
  );
}
