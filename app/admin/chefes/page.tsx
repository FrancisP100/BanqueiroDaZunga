import { UserCheck } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminChefesPage() {
  const { profiles } = await getMvpData();
  const chefes = profiles.filter((profile) => profile.papel === "chefe");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Gestão
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Líderes
        </h1>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.23fr_0.77fr]">
        <div>
          <h2 className="mb-3 text-xl font-extrabold text-bci-ink">
            Cadastrar um novo líder
          </h2>
          <ProfileForm
            role="chefe"
            title="Dados do líder"
            description="Registe um líder para gerir presenças e acompanhar o desempenho dos banqueiros."
            action={registerProfile}
          />
        </div>

        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-navySoft text-bci-navy">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-muted">
                Líderes
              </p>
              <p className="text-2xl font-extrabold text-bci-ink">
                {chefes.length} registados
              </p>
            </div>
          </div>

          {chefes.length === 0 ? (
            <p className="py-8 text-center text-sm text-bci-muted">
              Nenhum líder registado ainda.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-bci-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {chefes.map((profile) => (
                    <tr key={profile.id} className="border-t border-bci-line">
                      <td className="px-4 py-3 font-bold">{profile.nome}</td>
                      <td className="px-4 py-3">{profile.codigoInterno}</td>
                      <td className="px-4 py-3 truncate text-bci-muted">
                        {profile.email}
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
