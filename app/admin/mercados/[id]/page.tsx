import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { markets as mockMarkets } from "@/lib/mock-data";
import { MarketDashboard } from "@/components/market-dashboard";
import { DeleteMarketButton } from "@/components/delete-market-button";
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
      {/* Breadcrumb com acções */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-bci-muted">
          <Link href="/admin/mercados" className="hover:text-bci-magenta transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Mercados
          </Link>
          <span>/</span>
          <span className="text-bci-ink">{market.nome}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/mercados/${market.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-bci-goldSoft px-4 py-2 text-xs font-extrabold text-bci-gold hover:bg-bci-gold hover:text-white transition-colors"
          >
            <Pencil size={14} />
            Editar
          </Link>
          <DeleteMarketButton marketId={market.id} marketName={market.nome} />
        </div>
      </div>

      <MarketDashboard market={market} />
    </div>
  );
}
