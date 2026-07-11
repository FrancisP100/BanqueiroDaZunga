import { Store } from 'lucide-react';
import { getMvpData } from '@/lib/data';
import { MarketForm } from '@/components/market-form';

export default async function AdminMercadosPage() {
  const { markets } = await getMvpData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Gestão
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Mercados
        </h1>
      </div>

      {/* Formulário por cima */}
      <div>
        <h2 className="mb-3 text-xl font-extrabold text-bci-ink">
          Registar novo mercado
        </h2>
        <MarketForm />
      </div>

      {/* Listagem por baixo */}
      <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
              <Store size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
                Mercados
              </p>
              <p className="text-2xl font-extrabold text-bci-ink">{markets.length} registados</p>
            </div>
          </div>

          {markets.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">
              Nenhum mercado registado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-bci-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Província</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Balcão</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((market) => (
                    <tr key={market.id} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{market.nome}</td>
                      <td className="px-4 py-3 text-bci-muted">{market.provincia}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-bci-navySoft px-2 py-0.5 text-xs font-bold text-bci-navy capitalize">
                          {market.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-bci-muted">{market.balcao ?? '-'}</td>
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
