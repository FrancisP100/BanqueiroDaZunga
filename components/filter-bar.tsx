"use client";

import { useState } from "react";
import { PROVINCIAS_ANGOLA } from "@/lib/constants";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  /** Rótulo para o select de balcão/mercado */
  balcaoLabel?: string;
  /** Lista de opções para o filtro de balcão/mercado (ex: nomes de mercados) */
  balcaoOptions?: string[];
  /** Mostrar o filtro de província */
  showProvincia?: boolean;
  /** Mostrar o filtro de balcão */
  showBalcao?: boolean;
  /** Callback com os filtros actuais */
  onFilter: (filters: { search: string; provincia: string; balcao: string }) => void;
}

export function FilterBar({
  balcaoLabel = "Balcão / Mercado",
  balcaoOptions = [],
  showProvincia = true,
  showBalcao = true,
  onFilter,
}: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [provincia, setProvincia] = useState("");
  const [balcao, setBalcao] = useState("");

  const handleChange = (
    newSearch?: string,
    newProvincia?: string,
    newBalcao?: string,
  ) => {
    const s = newSearch ?? search;
    const p = newProvincia ?? provincia;
    const b = newBalcao ?? balcao;
    onFilter({ search: s, provincia: p, balcao: b });
  };

  const hasFilters = search || provincia || balcao;

  const clearAll = () => {
    setSearch("");
    setProvincia("");
    setBalcao("");
    onFilter({ search: "", provincia: "", balcao: "" });
  };

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
        <Filter size={14} />
        Filtros
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Pesquisa por nome / código */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleChange(e.target.value, undefined, undefined);
            }}
            placeholder="Pesquisar por nome ou código..."
            className="w-full rounded-xl border border-bci-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100 transition-all"
          />
        </div>

        {/* Filtro de Província */}
        {showProvincia && (
          <select
            value={provincia}
            onChange={(e) => {
              setProvincia(e.target.value);
              handleChange(undefined, e.target.value, undefined);
            }}
            className="rounded-xl border border-bci-line bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100 transition-all"
          >
            <option value="">Todas as províncias</option>
            {PROVINCIAS_ANGOLA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        {/* Filtro de Balcão / Mercado */}
        {showBalcao && balcaoOptions.length > 0 && (
          <select
            value={balcao}
            onChange={(e) => {
              setBalcao(e.target.value);
              handleChange(undefined, undefined, e.target.value);
            }}
            className="rounded-xl border border-bci-line bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-bci-pink focus:ring-4 focus:ring-pink-100 transition-all"
          >
            <option value="">Todos os {balcaoLabel.toLowerCase()}</option>
            {balcaoOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}

        {/* Limpar filtros */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
