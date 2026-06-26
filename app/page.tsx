import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-bci-line bg-white/92 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-pink text-sm font-extrabold text-white">
              BCI
            </div>
            <p className="text-sm font-extrabold text-bci-ink">
              Bankeiros da Zunga
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-bci-navy px-5 py-2 text-sm font-extrabold text-white transition hover:bg-bci-navy/90"
          >
            Entrar
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Inclusao financeira - Angola
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-bci-ink sm:text-6xl">
            Plataforma de gestao para banqueiros do mercado
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-bci-muted">
            MVP modular para abertura de contas, confirmacao de presenca por GPS
            e acompanhamento operacional em tempo real por chefes e
            administradores.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/onboarding"
              className="group rounded-xl bg-bci-pink px-6 py-4 text-sm font-extrabold text-white shadow-pink transition hover:bg-bci-pink/90"
            >
              Comece agora
              <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-bci-line px-6 py-4 text-sm font-extrabold text-bci-ink transition hover:bg-bci-bg"
            >
              Ja tem uma conta
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-bci-line bg-bci-bg px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold text-bci-ink">
            Como funciona
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-bci-line bg-white p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-bci-pinkSoft text-bci-pink">
                <span className="text-lg font-extrabold">1</span>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-bci-ink">
                Registe-se
              </h3>
              <p className="mt-2 text-sm text-bci-muted">
                Escolha o seu papel na plataforma e preencha os dados
                necessarios.
              </p>
            </div>
            <div className="rounded-2xl border border-bci-line bg-white p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-bci-pinkSoft text-bci-pink">
                <span className="text-lg font-extrabold">2</span>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-bci-ink">
                Entre na plataforma
              </h3>
              <p className="mt-2 text-sm text-bci-muted">
                Use o seu email e senha para aceder a area de trabalho.
              </p>
            </div>
            <div className="rounded-2xl border border-bci-line bg-white p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-bci-pinkSoft text-bci-pink">
                <span className="text-lg font-extrabold">3</span>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-bci-ink">
                Comece a trabalhar
              </h3>
              <p className="mt-2 text-sm text-bci-muted">
                Abra contas, marque presencas e acompanhe desempenho em tempo
                real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-bci-line px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-bci-ink">
            Pronto para comeclar?
          </h2>
          <p className="mt-4 text-lg text-bci-muted">
            Junte-se ao programa e comece a impactar financeiramente.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex rounded-xl bg-bci-navy px-6 py-4 text-sm font-extrabold text-white transition hover:bg-bci-navy/90"
          >
            Registar-se agora
          </Link>
        </div>
      </section>
    </main>
  );
}
