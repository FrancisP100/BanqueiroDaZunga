import { Building2, Home, Store, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile-form";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminChefesPage() {
  const { profiles } = await getMvpData();
  const admin = profiles.find((profile) => profile.papel === "admin")!;
  const chefes = profiles.filter((profile) => profile.papel === "chefe");

  return (
    <AppShell
      title="Cadastro de Líderes"
      eyebrow="Novo líder"
      userName={admin.nome}
      userMeta={admin.codigoInterno}
      navItems={[
        { href: "/admin", label: "Visao geral", icon: Home },
        { href: "/admin/banqueiros", label: "Bankeiros", icon: Users },
        { href: "/admin/chefes", label: "Líderes", icon: Building2 },
        { href: "/admin/mercados", label: "Mercados", icon: Store },
      ]}
    >
      <section className="grid gap-6 xl:grid-cols-[1.23fr_0.77fr]">
        <div>
          <h2 className="mb-3 text-xl font-extrabold text-bci-ink">
            Cadastrar um novo líder
          </h2>
          <ProfileForm
            role="chefe"
            title="Dados do líder"
            description="Registe um líder para gerir presencas e acompanhar o desempenho dos banqueiros."
            action={registerProfile}
          />
        </div>
        <div className="rounded-2xl border border-bci-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-bci-pink">
                Líderes
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-bci-ink">
                {chefes.length} ativos
              </h3>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-bci-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-bci-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Codigo</th>
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
        </div>
      </section>
    </AppShell>
  );
}
