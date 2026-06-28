'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Users, MapPin } from 'lucide-react';

type Banqueiro = {
  id: string;
  nome: string;
  email: string;
  codigoInterno: string;
  telefone: string | null;
  provincia: string | null;
  mercadoNome: string | null;
  ativo: boolean;
};

export default function ChefeBanqueirosPage() {
  const [banqueiros, setBanqueiros] = useState<Banqueiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email, codigo_interno, telefone, provincia, local_id, ativo')
        .eq('papel', 'banqueiro')
        .order('nome');

      const { data: markets } = await supabase
        .from('markets')
        .select('id, nome');

      const marketMap: Record<string, string> = {};
      (markets ?? []).forEach((m: { id: string; nome: string }) => { marketMap[m.id] = m.nome; });

      setBanqueiros(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profiles ?? []).map((p: any) => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          codigoInterno: p.codigo_interno,
          telefone: p.telefone,
          provincia: p.provincia,
          mercadoNome: p.local_id ? (marketMap[p.local_id] ?? null) : null,
          ativo: p.ativo,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = banqueiros.filter(
    (b) =>
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      b.codigoInterno.toLowerCase().includes(search.toLowerCase()) ||
      (b.mercadoNome ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
            Painel do Chefe
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
            Banqueiros
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-bci-line bg-white px-4 py-2 shadow-card">
          <Users size={16} className="text-bci-muted" />
          <span className="text-sm font-bold text-bci-ink">{banqueiros.length} registados</span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Pesquisar por nome, código ou mercado..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-bci-line bg-white px-4 py-3 text-sm font-medium outline-none focus:border-bci-blue focus:ring-4 focus:ring-blue-100 shadow-card"
      />

      {/* Table */}
      <div className="rounded-2xl border border-bci-line bg-white shadow-card overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-sm text-bci-muted">A carregar banqueiros…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-bci-muted">
            {search ? 'Nenhum resultado para a pesquisa.' : 'Nenhum banqueiro registado.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Mercado</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-bci-line hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-bci-ink">{b.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-bci-muted">{b.codigoInterno}</td>
                    <td className="px-4 py-3 text-bci-muted truncate max-w-[180px]">{b.email}</td>
                    <td className="px-4 py-3 text-bci-muted">{b.telefone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {b.mercadoNome ? (
                        <span className="inline-flex items-center gap-1 text-bci-muted">
                          <MapPin size={12} className="text-bci-blue" />
                          {b.mercadoNome}
                        </span>
                      ) : (
                        <span className="text-bci-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        b.ativo
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {b.ativo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
