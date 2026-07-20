"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { ToggleProfileStatus } from "@/components/toggle-profile-status";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import type { Profile, Market } from "@/lib/types";

interface BanqueirosTableProps {
  banqueiros: Profile[];
  markets: Market[];
}

export function BanqueirosTable({ banqueiros, markets }: BanqueirosTableProps) {
  const [filters, setFilters] = useState({ search: "", provincia: "", balcao: "" });

  const marketMap = useMemo(
    () => new Map(markets.map((m) => [m.id, m])),
    [markets],
  );

  // Lista única de nomes de mercados (para o dropdown de balcão)
  const marketNames = useMemo(
    () => [...new Set(markets.map((m) => m.nome))].sort(),
    [markets],
  );

  const filtered = useMemo(() => {
    return banqueiros.filter((b) => {
      // Filtro de texto (nome ou código)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = b.nome.toLowerCase().includes(q);
        const matchesCode = b.codigoInterno?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }

      // Filtro de província
      if (filters.provincia) {
        // Verificar na província do perfil OU na província do mercado associado
        const profileProvincia = b.provincia?.toLowerCase() ?? "";
        const market = b.localId ? marketMap.get(b.localId) : undefined;
        const marketProvincia = market?.provincia?.toLowerCase() ?? "";
        const filterProv = filters.provincia.toLowerCase();

        if (profileProvincia !== filterProv && marketProvincia !== filterProv) {
          return false;
        }
      }

      // Filtro de balcão (nome do mercado)
      if (filters.balcao) {
        const market = b.localId ? marketMap.get(b.localId) : undefined;
        if (!market || market.nome !== filters.balcao) return false;
      }

      return true;
    });
  }, [banqueiros, filters, marketMap]);

  return (
    <>
      <FilterBar
        balcaoLabel="Mercados"
        balcaoOptions={marketNames}
        showProvincia
        showBalcao
        onFilter={setFilters}
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-bci-muted">
          {filters.search || filters.provincia || filters.balcao
            ? "Nenhum Bankeiro encontrado com os filtros aplicados."
            : "Nenhum Bankeiro registado ainda."}
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-bci-muted">
            A mostrar <span className="font-bold text-bci-ink">{filtered.length}</span> de{" "}
            {banqueiros.length} bankeiros
          </p>
          <div className="overflow-x-auto rounded-2xl border border-bci-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Mercado</th>
                  <th className="px-4 py-3">Província</th>
                  <th className="px-4 py-3">Acções</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((profile) => {
                  const market = profile.localId
                    ? marketMap.get(profile.localId)
                    : undefined;
                  return (
                    <tr
                      key={profile.id}
                      className={`border-t border-bci-line ${
                        !profile.ativo ? "opacity-60 bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            profile.ativo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {profile.ativo ? "Activo" : "Bloqueado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">{profile.nome}</td>
                      <td className="px-4 py-3">{profile.codigoInterno}</td>
                      <td className="px-4 py-3 text-bci-muted">
                        {market?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-bci-muted">
                        {profile.provincia ?? market?.provincia ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/admin/banqueiros/${profile.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-bci-navySoft px-3 py-1.5 text-xs font-extrabold text-bci-navy hover:bg-bci-navy hover:text-white transition-colors"
                          >
                            <Eye size={14} /> Inspecionar
                          </Link>
                          <Link
                            href={`/admin/perfil/${profile.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-bci-goldSoft px-3 py-1.5 text-xs font-extrabold text-bci-gold hover:bg-bci-gold hover:text-white transition-colors"
                          >
                            <Pencil size={14} /> Editar
                          </Link>
                          <ToggleProfileStatus
                            profileId={profile.id}
                            profileName={profile.nome}
                            ativo={profile.ativo}
                          />
                          <DeleteProfileButton
                            profileId={profile.id}
                            profileName={profile.nome}
                            roleLabel="o Bankeiro"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
