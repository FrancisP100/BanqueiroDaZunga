"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { ToggleProfileStatus } from "@/components/toggle-profile-status";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import type { Profile, Market } from "@/lib/types";

interface ChefesTableProps {
  chefes: Profile[];
  markets: Market[];
}

export function ChefesTable({ chefes, markets }: ChefesTableProps) {
  const [filters, setFilters] = useState({ search: "", provincia: "", balcao: "" });

  const marketMap = useMemo(
    () => new Map(markets.map((m) => [m.id, m])),
    [markets],
  );

  // Unique market names for the balcão dropdown
  const marketNames = useMemo(
    () => [...new Set(markets.map((m) => m.nome))].sort(),
    [markets],
  );

  const filtered = useMemo(() => {
    return chefes.filter((c) => {
      // Text search (name or code)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = c.nome.toLowerCase().includes(q);
        const matchesCode = c.codigoInterno?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }

      // Province filter
      if (filters.provincia) {
        const profileProvincia = c.provincia?.toLowerCase() ?? "";
        const market = c.localId ? marketMap.get(c.localId) : undefined;
        const marketProvincia = market?.provincia?.toLowerCase() ?? "";
        const filterProv = filters.provincia.toLowerCase();

        if (profileProvincia !== filterProv && marketProvincia !== filterProv) {
          return false;
        }
      }

      // Market (balcão) filter
      if (filters.balcao) {
        const market = c.localId ? marketMap.get(c.localId) : undefined;
        if (!market || market.nome !== filters.balcao) return false;
      }

      return true;
    });
  }, [chefes, filters, marketMap]);

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
            ? "Nenhum líder encontrado com os filtros aplicados."
            : "Nenhum líder registado ainda."}
        </p>
      ) : (
        <>
          <p className="mb-3 text-xs text-bci-muted">
            A mostrar <span className="font-bold text-bci-ink">{filtered.length}</span> de{" "}
            {chefes.length} líderes
          </p>
          <div className="overflow-x-auto rounded-2xl border border-bci-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Email</th>
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
                      <td className="px-4 py-3 truncate text-bci-muted">
                        {profile.email}
                      </td>
                      <td className="px-4 py-3 text-bci-muted">
                        {market?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-bci-muted">
                        {profile.provincia ?? market?.provincia ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                            roleLabel="o líder"
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
