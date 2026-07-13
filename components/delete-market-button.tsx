"use client";

import { Trash2 } from "lucide-react";
import { deleteMarket } from "@/app/admin/actions";

interface Props {
  marketId: string;
  marketName: string;
  compact?: boolean;
}

export function DeleteMarketButton({ marketId, marketName, compact }: Props) {
  return (
    <button
      onClick={async () => {
        if (!confirm(`Tem a certeza que deseja eliminar o mercado "${marketName}"?`)) return;
        const result = await deleteMarket(marketId);
        if (result?.error) {
          alert("Erro: " + result.error);
        }
      }}
      className={`inline-flex items-center gap-1 text-xs font-bold transition-colors ${
        compact
          ? "rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 hover:bg-red-600 hover:text-white"
          : "rounded-xl bg-red-50 px-4 py-2 font-extrabold text-red-600 hover:bg-red-600 hover:text-white"
      }`}
    >
      <Trash2 size={compact ? 12 : 14} />
      {!compact && <span>Eliminar</span>}
    </button>
  );
}
