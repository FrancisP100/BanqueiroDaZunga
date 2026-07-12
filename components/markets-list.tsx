"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Store, Search, BarChart3 } from "lucide-react";
import type { Market } from "@/lib/types";

export function MarketsList({ markets }: { markets: Market[] }) {
  const [filterProvincia, setFilterProvincia] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");

  const provincias = useMemo(
    () => Array.from(new Set(markets.map((m) => m.provincia))).sort(),
    [markets],
  );

  const filtered = useMemo(() => {
    let list = markets;
    if (filterProvincia !== "todas") {
      list = list.filter((m) => m.provincia === filterProvincia);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.provincia.toLowerCase().includes(q) ||
          (m.balcao ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [markets, filterProvincia, searchQuery]);

  return (
    <div className="rounded-2xl border border-bci-line bg-white p-4 sm:p-5 shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
          <Store size={18} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
            Mercados
          </p>
          <p className="text-2xl font-extrabold text-bci-ink">
            {markets.length} registados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-5">
        {/* Pesquisa */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-bci-muted"
          />
          <input
            type="text"
            placeholder="Pesquisar mercados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-bci-line bg-white pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-50 transition-all"
          />
        </div>

        {/* Filtro por província */}
        <select
          value={filterProvincia}
          onChange={(e) => setFilterProvincia(e.target.value)}
          className="rounded-xl border border-bci-line bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-bci-magenta focus:ring-4 focus:ring-pink-50 transition-all min-w-[150px]"
          aria-label="Filtrar por província"
        >
          <option value="todas">Todas as províncias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Contador de resultados */}
        <div className="flex items-center text-xs font-semibold text-bci-muted px-2">
          {filtered.length} de {markets.length} mercados
        </div>
      </div>

      {/* Listagem / Tabela */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Store size={32} className="mx-auto mb-3 text-bci-muted/50" />
          <p className="text-sm font-semibold text-bci-muted">
            {searchQuery || filterProvincia !== "todas"
              ? "Nenhum mercado encontrado com os filtros actuais."
              : "Nenhum mercado registado ainda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bci-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-3 sm:px-4 py-3 whitespace-nowrap">Nome</th>
                <th className="px-3 sm:px-4 py-3 whitespace-nowrap">Província</th>
                <th className="px-3 sm:px-4 py-3 whitespace-nowrap">Tipo</th>
                <th className="px-3 sm:px-4 py-3 whitespace-nowrap">Balcão</th>
                <th className="px-3 sm:px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((market) => (
                <tr
                  key={market.id}
                  className="border-t border-bci-line hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-3 sm:px-4 py-3 font-bold whitespace-nowrap">
                    {market.nome}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-bci-muted whitespace-nowrap">
                    {market.provincia}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <span className="inline-block rounded-full bg-bci-navySoft px-2.5 py-0.5 text-xs font-bold text-bci-navy capitalize whitespace-nowrap">
                      {market.tipo}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-bci-muted whitespace-nowrap">
                    {market.balcao ?? "—"}
                  </td>
                  <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/mercados/${market.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-bci-navySoft px-2.5 py-1.5 text-xs font-bold text-bci-navy hover:bg-bci-navy hover:text-white transition-colors"
                    >
                      <BarChart3 size={12} />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
