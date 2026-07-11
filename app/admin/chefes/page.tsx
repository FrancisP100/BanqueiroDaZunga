import { UserCheck, Pencil } from "lucide-react";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { DeleteProfileButton } from "@/components/delete-profile-button";
import { ToggleProfileStatus } from "@/components/toggle-profile-status";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminChefesPage() {
  const { profiles, markets } = await getMvpData();
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

      {/* Formulário por cima */}
      <div>
        <h2 className="mb-3 text-xl font-extrabold text-bci-ink">
          Cadastrar um novo líder
        </h2>
        <ProfileForm
          role="chefe"
          title="Dados do líder"
          description="O líder precisa obrigatoriamente de estar associado a um balcão (Mercado local ou Nº do Balcão) para poder acompanhar os banqueiros."
          showMarket
          markets={markets}
          action={registerProfile}
        />
      </div>

      {/* Listagem por baixo */}
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
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {chefes.map((profile) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
