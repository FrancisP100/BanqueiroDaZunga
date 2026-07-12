import { getMvpData } from '@/lib/data';
import { MarketForm } from '@/components/market-form';
import { FormDialog } from '@/components/form-dialog';
import { MarketsList } from '@/components/markets-list';

export default async function AdminMercadosPage() {
  const { markets } = await getMvpData();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
            Gestão
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-bci-ink">
            Mercados
          </h1>
        </div>
        <FormDialog
          triggerLabel="Registar mercado"
          title="Registar novo mercado"
        >
          <MarketForm />
        </FormDialog>
      </div>

      {/* Listagem com filtros */}
      <MarketsList markets={markets} />
    </div>
  );
}
