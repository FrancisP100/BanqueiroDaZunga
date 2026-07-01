import { Users, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminBanqueirosPage() {
  const { markets, profiles } = await getMvpData();
  const banqueiros = profiles.filter(
    (profile) => profile.papel === "banqueiro",
  );
  const marketMap = new Map(markets.map((market) => [market.id, market.nome]));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Gestão
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Bankeiros
        </h1>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.23fr_0.77fr]">
        <div>
          <h2 className="mb-3 text-xl font-extrabold text-bci-ink">
            Cadastrar um novo banqueiro
          </h2>
          <ProfileForm
            role="banqueiro"
            title="Dados do banqueiro"
            description="Use este formulário para registar um novo banqueiro e associar um mercado local, se aplicável."
            showMarket
            markets={markets}
            action={registerProfile}
          />
        </div>

        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
                Bankeiros
              </p>
              <p className="text-2xl font-extrabold text-bci-ink">
                {banqueiros.length} registados
              </p>
            </div>
          </div>

          {banqueiros.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">
              Nenhum banqueiro registado ainda.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-bci-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Mercado</th>
                    <th className="px-4 py-3">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {banqueiros.map((profile) => (
                    <tr key={profile.id} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{profile.nome}</td>
                      <td className="px-4 py-3">{profile.codigoInterno}</td>
                      <td className="px-4 py-3 text-bci-muted">
                        {profile.localId
                          ? (marketMap.get(profile.localId) ?? profile.localId)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/chefe/banqueiros/${profile.id}`}
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
                          <DeleteProfileButton
                            profileId={profile.id}
                            profileName={profile.nome}
                            roleLabel="o banqueiro"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
