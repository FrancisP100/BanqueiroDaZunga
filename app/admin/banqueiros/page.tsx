import { Users } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { FormDialog } from "@/components/form-dialog";
import { BanqueirosTable } from "@/components/banqueiros-table";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminBanqueirosPage() {
  const { markets, profiles } = await getMvpData();
  const banqueiros = profiles.filter(
    (profile) => profile.papel === "banqueiro",
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
            Gestão
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
            Bankeiros
          </h1>
        </div>
        <FormDialog
          triggerLabel="Cadastrar Bankeiro"
          title="Cadastrar novo Bankeiro"
        >
          <ProfileForm
            role="banqueiro"
            title="Dados do Bankeiro"
            description="Use este formulário para registar um novo Bankeiro e associar um mercado local, se aplicável."
            showMarket
            markets={markets}
            action={registerProfile}
          />
        </FormDialog>
      </div>

      {/* Listagem */}
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

        <BanqueirosTable banqueiros={banqueiros} markets={markets} />
      </div>
    </div>
  );
}
