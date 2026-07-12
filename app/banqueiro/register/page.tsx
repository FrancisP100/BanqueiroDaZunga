import { getMvpData } from "@/lib/data";
import { ProfileForm } from "@/components/profile-form";
import Link from "next/link";

export default async function BanqueiroRegisterPage() {
  const { markets } = await getMvpData();

  return (
    <main className="min-h-screen bg-bci-bg px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-10 rounded-3xl bg-white p-8 shadow-card">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Registo de Bankeiro
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-bci-ink">
            Junte-se ao programa
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-bci-muted">
            Preencha os dados abaixo para registar o seu perfil de Bankeiro e
            começar a abrir contas e marcar presencas.
          </p>
        </section>

        <ProfileForm
          role="banqueiro"
          title="Dados do Bankeiro"
          description="Registe o seu perfil e associe um mercado local, se aplicavel."
          showMarket
          markets={markets}
        />

        <div className="mt-6 text-sm text-bci-muted">
          <p>
            Ja tem uma conta?{" "}
            <Link href="/banqueiro/login" className="font-bold text-bci-pink">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
