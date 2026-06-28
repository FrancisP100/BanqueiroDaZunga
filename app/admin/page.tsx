import Link from 'next/link';
import { Users, UserCheck, Store, Settings } from 'lucide-react';
import { getMvpData } from '@/lib/data';
import { updatePunctualityRule } from '@/app/admin/actions';

export default async function AdminDashboard() {
  const { profiles, markets, punctualityRule } = await getMvpData();

  const banqueiros = profiles.filter((p) => p.papel === 'banqueiro');
  const chefes = profiles.filter((p) => p.papel === 'chefe');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Administração Global
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Painel de Controlo
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
            Mercados
          </p>
          <p className="mt-2 text-3xl font-extrabold text-bci-ink">{markets.length}</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
            Banqueiros
          </p>
          <p className="mt-2 text-3xl font-extrabold text-bci-ink">{banqueiros.length}</p>
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
            Chefes
          </p>
          <p className="mt-2 text-3xl font-extrabold text-bci-ink">{chefes.length}</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="mb-4 text-lg font-extrabold text-bci-ink">Gestão</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/banqueiros"
            className="group flex items-center gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card transition hover:border-bci-navy hover:shadow-soft"
          >
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-bci-navySoft text-bci-navy group-hover:bg-bci-navy group-hover:text-white transition-colors">
              <Users size={22} />
            </div>
            <div>
              <p className="font-extrabold text-bci-ink">Gerir Banqueiros</p>
              <p className="mt-0.5 text-xs text-bci-muted">
                {banqueiros.length} registados
              </p>
            </div>
          </Link>

          <Link
            href="/admin/chefes"
            className="group flex items-center gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card transition hover:border-bci-navy hover:shadow-soft"
          >
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-bci-navySoft text-bci-navy group-hover:bg-bci-navy group-hover:text-white transition-colors">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="font-extrabold text-bci-ink">Gerir Chefes</p>
              <p className="mt-0.5 text-xs text-bci-muted">
                {chefes.length} registados
              </p>
            </div>
          </Link>

          <Link
            href="/admin/mercados"
            className="group flex items-center gap-4 rounded-2xl border border-bci-line bg-white p-5 shadow-card transition hover:border-bci-navy hover:shadow-soft"
          >
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-bci-navySoft text-bci-navy group-hover:bg-bci-navy group-hover:text-white transition-colors">
              <Store size={22} />
            </div>
            <div>
              <p className="font-extrabold text-bci-ink">Gerir Mercados</p>
              <p className="mt-0.5 text-xs text-bci-muted">
                {markets.length} registados
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Punctuality Settings */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
            <Settings size={18} />
          </div>
          <div>
            <p className="font-extrabold text-bci-ink">Regras de Pontualidade</p>
            <p className="text-xs text-bci-muted">Definir hora limite e tolerância para marcação de presença</p>
          </div>
        </div>

        <form action={updatePunctualityRule} className="grid gap-4 md:grid-cols-3 items-end">
          <label className="text-sm font-bold text-bci-ink">
            Hora limite
            <input
              name="hora_limite"
              type="time"
              defaultValue={punctualityRule.horaLimite}
              className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
            />
          </label>
          <label className="text-sm font-bold text-bci-ink">
            Tolerância (minutos)
            <input
              name="tolerancia_min"
              type="number"
              defaultValue={punctualityRule.toleranciaMin}
              min={0}
              max={120}
              className="mt-2 w-full rounded-xl border border-bci-line px-4 py-3 font-medium outline-none focus:border-bci-navy focus:ring-4 focus:ring-bci-navySoft"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-bci-navy px-5 py-3 text-sm font-extrabold text-white hover:bg-bci-navy2 transition-colors"
          >
            Guardar regras
          </button>
        </form>
      </div>
    </div>
  );
}
