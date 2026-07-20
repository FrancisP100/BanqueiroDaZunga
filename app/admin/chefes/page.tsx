import { UserCheck } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { FormDialog } from "@/components/form-dialog";
import { ChefesTable } from "@/components/chefes-table";
import { getMvpData } from "@/lib/data";
import { registerProfile } from "@/app/admin/actions";

export default async function AdminChefesPage() {
  const { profiles, markets } = await getMvpData();
  const chefes = profiles.filter((profile) => profile.papel === "chefe");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
            Gestão
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
            Líderes
          </h1>
        </div>
        <FormDialog
          triggerLabel="Cadastrar líder"
          title="Cadastrar novo líder"
        >
          <ProfileForm
            role="chefe"
            title="Dados do líder"
            description="O líder precisa obrigatoriamente de estar associado a um balcão (Mercado local ou Nº do Balcão) para poder acompanhar os Bankeiros."
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

        <ChefesTable chefes={chefes} markets={markets} />
      </div>
    </div>
  );
}
