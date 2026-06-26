import { Clock3, FilePlus2, Home, ListChecks, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PresenceBadge, PunctualityBadge } from "@/components/ui/status-badge";
import { todayISO } from "@/lib/date";
import { PresenceForm } from "./presence-form";
import { getMvpData } from "@/lib/data";

export default async function PresencaPage() {
  const { markets, presences, profiles, punctualityRule } = await getMvpData();
  const user = profiles.find((profile) => profile.papel === "banqueiro")!;
  const presence = presences.find((item) => item.profileId === user.id && item.data === todayISO());
  const market = markets.find((item) => item.id === user.localId);

  return (
    <AppShell
      title="Presenca GPS"
      eyebrow="Validacao no local"
      userName={user.nome}
      userMeta={user.codigoInterno}
      navItems={[
        { href: "/banqueiro", label: "Dashboard", icon: Home },
        { href: "/banqueiro#nova-conta", label: "Abertura de conta", icon: FilePlus2 },
        { href: "/banqueiro/contas", label: "Contas", icon: ListChecks },
        { href: "/banqueiro/presenca", label: "Presenca GPS", icon: MapPin }
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
          <Clock3 className="h-7 w-7 text-bci-pink" />
          <h2 className="mt-4 text-2xl font-extrabold text-bci-ink">Registo de hoje</h2>
          <p className="mt-2 text-sm leading-6 text-bci-muted">
            Hora limite {punctualityRule.horaLimite}, tolerancia de {punctualityRule.toleranciaMin} minutos e raio de {market?.raioMetros ?? 100} metros.
          </p>
          <div className="mt-5 space-y-3 rounded-xl bg-bci-bg p-4 text-sm">
            <div className="flex justify-between"><span>Entrada</span><b>{presence?.entrada ?? "--:--"}</b></div>
            <div className="flex justify-between"><span>Mercado</span><b>{market?.nome}</b></div>
            <div className="flex justify-between"><span>Estado GPS</span>{presence ? <PresenceBadge value={presence.status} /> : <span className="text-bci-muted">Pendente</span>}</div>
            <div className="flex justify-between"><span>Pontualidade</span>{presence ? <PunctualityBadge value={presence.pontualidade} /> : <span className="text-bci-muted">Pendente</span>}</div>
          </div>
          {market ? <PresenceForm market={market} /> : null}
        </section>

        <section className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
          <h3 className="text-xl font-extrabold text-bci-ink">Mercado atribuido</h3>
          <div className="mt-4 rounded-2xl bg-bci-navy p-6 text-white">
            <p className="text-sm font-bold text-white/70">{market?.provincia}</p>
            <p className="mt-2 text-3xl font-extrabold">{market?.nome}</p>
            <p className="mt-3 text-sm text-white/72">Lat {market?.latitude}, Lng {market?.longitude}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
