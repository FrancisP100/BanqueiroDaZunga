"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Search, Users } from "lucide-react";
import { PresenceBadge } from "@/components/ui/status-badge";
import type { PresenceStatus } from "@/lib/types";
import { getAllowedMarketIds } from "@/lib/leader-scope";

type BanqueiroRow = {
  id: string;
  nome: string;
  codigoInterno: string;
  telefone: string | null;
  mercadoNome: string;
  ativo: boolean;
};

type PresencaHoje = {
  profileId: string;
  status: PresenceStatus;
};

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function BanqueirosPage() {
  const [loading, setLoading] = useState(true);
  const [banqueiros, setBanqueiros] = useState<BanqueiroRow[]>([]);
  const [presencasHoje, setPresencasHoje] = useState<PresencaHoje[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [bResult, mResult, pResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, nome, codigo_interno, telefone, local_id, ativo")
            .eq("papel", "banqueiro")
            .order("nome"),
          supabase.from("markets").select("id, nome"),
          supabase
            .from("presences")
            .select("profile_id, status")
            .eq("data", today()),
        ]);

        if (bResult.error) throw bResult.error;

        const marketMap: Record<string, string> = {};
        (mResult.data ?? []).forEach((m: { id: string; nome: string }) => {
          marketMap[m.id] = m.nome;
        });

        // Filter by this leader's balcão
        const allowedMarketIds = await getAllowedMarketIds(supabase);
        const canSeeAll = allowedMarketIds.size === 0;

        const filteredBanqueiros = (bResult.data ?? [])
          .filter((b: { local_id: string | null }) => canSeeAll || (b.local_id && allowedMarketIds.has(b.local_id)))
          .map(
            (b: {
              id: string;
              nome: string;
              codigo_interno: string;
              telefone: string | null;
              local_id: string | null;
              ativo: boolean;
            }) => ({
              id: b.id,
              nome: b.nome,
              codigoInterno: b.codigo_interno,
              telefone: b.telefone,
              mercadoNome: b.local_id ? (marketMap[b.local_id] ?? "—") : "—",
              ativo: b.ativo,
            }),
          );

        setBanqueiros(filteredBanqueiros);

        const allowedProfileIds = new Set(filteredBanqueiros.map(b => b.id));
        setPresencasHoje(
          (pResult.data ?? [])
            .filter((p: { profile_id: string }) => canSeeAll || allowedProfileIds.has(p.profile_id))
            .map((p: { profile_id: string; status: PresenceStatus }) => ({
              profileId: p.profile_id,
              status: p.status,
            })),
        );
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Erro ao carregar banqueiros");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = banqueiros.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.nome.toLowerCase().includes(q) ||
      b.codigoInterno.toLowerCase().includes(q) ||
      b.mercadoNome.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-bci-muted">A carregar banqueiros...</div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
          Gestão de equipa
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Bankeiros
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Lista de banqueiros sob a sua supervisão. Clique em inspecionar para ver
          presenças e clientes.
        </p>
      </div>

      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-bci-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-bci-blue" />
            <div>
              <h2 className="font-extrabold text-bci-ink">Bankeiros registados</h2>
              <p className="text-xs text-bci-muted mt-0.5">
                {banqueiros.length} banqueiro{banqueiros.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-bci-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, código ou mercado..."
              className="pl-9 w-full sm:w-72 rounded-xl border border-bci-line px-3 py-2 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Mercado</th>
                <th className="px-4 py-3">Presença hoje</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-bci-muted">
                    {search
                      ? "Nenhum banqueiro encontrado para esta pesquisa."
                      : "Nenhum banqueiro registado."}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const pres = presencasHoje.find((p) => p.profileId === b.id);
                  return (
                    <tr
                      key={b.id}
                      className="border-t border-bci-line hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-bold">{b.nome}</td>
                      <td className="px-4 py-3 text-bci-muted">{b.codigoInterno}</td>
                      <td className="px-4 py-3 text-bci-muted">{b.mercadoNome}</td>
                      <td className="px-4 py-3">
                        {pres ? (
                          <PresenceBadge value={pres.status} />
                        ) : (
                          <span className="text-bci-muted text-xs">Sem registo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            b.ativo
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.ativo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/chefe/banqueiros/${b.id}`}
                          className="rounded-lg bg-bci-navySoft px-3 py-1.5 text-xs font-extrabold text-bci-navy hover:bg-bci-navy hover:text-white transition-colors"
                        >
                          Inspecionar
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
