import { getMvpData } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import Link from "next/link";

export default async function ChefeRegisterPage() {
  const { markets } = await getMvpData();

  return (
    <main className="min-h-screen bg-bci-bg px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-10 rounded-3xl bg-white p-8 shadow-card">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Registo de Líder
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-bci-ink">
            Registar novo líder de balcão
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-bci-muted">
            Crie um perfil de líder para acompanhar os Bankeiros. O líder precisa
            obrigatoriamente de estar associado a um balcão ou mercado.
          </p>
        </section>

        <ProfileForm
          role="chefe"
          title="Dados do líder"
          description="Associe o líder a um balcão para que ele veja apenas os banqueiros desse balcão."
          showMarket
          markets={markets}
        />

        <div className="mt-6 text-sm text-bci-muted">
          <p>
            Ja tem uma conta?{" "}
            <Link href="/chefe/login" className="font-bold text-bci-pink">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
