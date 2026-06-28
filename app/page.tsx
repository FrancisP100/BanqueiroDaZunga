import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Logo BCI inline — não depende de ficheiro externo */
function BciLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BCI Logo"
    >
      {/* Símbolo geométrico BCI — três rectângulos aninhados + pilar direito */}
      <rect x="18" y="14" width="64" height="8" rx="2" fill="#e91e8c" />
      <rect x="18" y="14" width="8" height="72" rx="2" fill="#e91e8c" />
      <rect x="28" y="26" width="46" height="8" rx="2" fill="#e91e8c" />
      <rect x="28" y="26" width="8" height="54" rx="2" fill="#e91e8c" />
      <rect x="38" y="38" width="28" height="8" rx="2" fill="#e91e8c" />
      <rect x="38" y="38" width="8" height="34" rx="2" fill="#e91e8c" />
      <rect x="72" y="14" width="8" height="72" rx="2" fill="#e91e8c" />
    </svg>
  );
}

/** Padrão geométrico BCI para fundo hero — replica o briefing */
function HeroPattern() {
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* 3 rectângulos concêntricos abertos — lado direito */}
      <rect x="180" y="20" width="400" height="16" rx="4" fill="#e91e8c" opacity="0.9" />
      <rect x="180" y="20" width="16" height="360" rx="4" fill="#e91e8c" opacity="0.9" />
      <rect x="230" y="60" width="350" height="16" rx="4" fill="#e91e8c" opacity="0.9" />
      <rect x="230" y="60" width="16" height="300" rx="4" fill="#e91e8c" opacity="0.9" />
      <rect x="280" y="100" width="300" height="16" rx="4" fill="#e91e8c" opacity="0.9" />
      <rect x="280" y="100" width="16" height="240" rx="4" fill="#e91e8c" opacity="0.9" />
      {/* Pilar direito */}
      <rect x="564" y="20" width="16" height="360" rx="4" fill="#e91e8c" opacity="0.9" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bci-dark text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-bci-dark/95 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 p-1.5">
              <BciLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
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
      <section className="relative flex min-h-[88vh] items-center overflow-hidden px-6 lg:px-12">
        {/* Fundo verde escuro com padrão geométrico rosa */}
        <HeroPattern />
        {/* Gradiente para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-bci-dark via-bci-dark/90 to-bci-dark/30" />

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
              Inclusão Financeira — Angola
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Bankeiros<br />
              <span className="text-bci-pink">da Zunga</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
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
      <section className="border-t border-white/10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-bci-pink">Como funciona</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white">Simples, rápido e operacional</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { step: "1", title: "Registe-se", desc: "Escolha o seu papel — banqueiro, chefe ou administrador — e preencha os seus dados." },
              { step: "2", title: "Entre na plataforma", desc: "Use o seu email e senha para aceder à área de trabalho correspondente." },
              { step: "3", title: "Comece a trabalhar", desc: "Abra contas, marque presenças por GPS e acompanhe o desempenho em tempo real." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-bci-pink text-base font-extrabold text-white">{step}</div>
                <h3 className="mt-4 text-lg font-extrabold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-white">Pronto para começar?</h2>
          <p className="mt-4 text-lg text-white/55">Junte-se ao programa e comece a impactar financeiramente.</p>
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
