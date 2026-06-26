import { ProfileForm } from "@/components/profile-form";
import Link from "next/link";

export default function ChefeRegisterPage() {
  return (
    <main className="min-h-screen bg-bci-bg px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <section className="mb-10 rounded-3xl bg-white p-8 shadow-card">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Registo de Chefe
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-bci-ink">
            Registe-se para gerir presencas
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-bci-muted">
            Crie um perfil de chefe para acompanhar os banqueiros e validar
            presencas no dia a dia.
          </p>
        </section>

        <ProfileForm
          role="chefe"
          title="Dados do chefe"
          description="Registe o seu perfil de chefe para aceder ao painel de operacao."
        />

        <div className="mt-6 text-sm text-bci-muted">
          <p>
            Ja tem uma conta?{" "}
            <Link href="/onboarding" className="font-bold text-bci-pink">
              Voltar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
