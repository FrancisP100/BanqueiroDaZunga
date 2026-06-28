import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bci-dark text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-bci-dark/95 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/10">
              <Image
                src="/logo.png"
                alt="BCI Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-white">
                Bankeiros da Zunga
              </p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                BCI
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-xl bg-bci-pink px-5 py-2 text-sm font-extrabold text-white transition hover:bg-bci-pinkDark"
          >
            Entrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden px-6 lg:px-12">
        {/* Imagem de fundo */}
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            className="object-cover object-right opacity-100"
            priority
          />
          {/* Gradiente sobre a imagem para garantir legibilidade do texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-bci-dark via-bci-dark/85 to-bci-dark/20" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
              Inclusão Financeira — Angola
            </p>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Bankeiros<br />
              <span className="text-bci-pink">da Zunga</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              Plataforma de gestão para banqueiros do mercado — abertura de
              contas, presença por GPS e acompanhamento operacional em tempo real.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="group inline-flex items-center rounded-xl bg-bci-pink px-7 py-4 text-sm font-extrabold text-white transition hover:bg-bci-pinkDark"
              >
                Comece agora
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Já tem conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-white/10 bg-bci-dark px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Como funciona
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">
            Simples, rápido e operacional
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Registe-se",
                desc: "Escolha o seu papel — banqueiro, chefe ou administrador — e preencha os seus dados.",
              },
              {
                step: "2",
                title: "Entre na plataforma",
                desc: "Use o seu email e senha para aceder à área de trabalho correspondente.",
              },
              {
                step: "3",
                title: "Comece a trabalhar",
                desc: "Abra contas, marque presenças por GPS e acompanhe o desempenho em tempo real.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-bci-pink text-lg font-extrabold text-white">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Junte-se ao programa e comece a impactar financeiramente.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex rounded-xl bg-bci-pink px-8 py-4 text-sm font-extrabold text-white transition hover:bg-bci-pinkDark"
          >
            Registar-se agora
          </Link>
        </div>
      </section>
    </main>
  );
}
