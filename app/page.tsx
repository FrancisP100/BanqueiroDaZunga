import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Users, ShieldCheck, ChevronRight } from "lucide-react";
import { BciLogo } from "@/components/ui/bci-logo";

const features = [
  {
    icon: MapPin,
    title: "Presença GPS",
    desc: "Marque presença com geolocalização em tempo real no mercado designado.",
    color: "text-bci-magenta bg-pink-50",
  },
  {
    icon: Users,
    title: "Gestão de Equipa",
    desc: "Líderes acompanham o desempenho e TPAs dos seus Bankeiros.",
    color: "text-bci-blue bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "Controlo Centralizado",
    desc: "Administração global de mercados, utilizadores e regras de pontualidade.",
    color: "text-bci-navy bg-bci-navySoft",
  },
];

const stats = [
  { label: "Mercados", value: "15+" },
  { label: "Bankeiros Activos", value: "200+" },
  { label: "Contas Abertas", value: "1.500+" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-bci-dark/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-white/10 p-1.5 transition-transform group-hover:scale-105">
              <BciLogo className="h-full w-full" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-bci-magenta px-5 py-2.5 text-sm font-extrabold text-white hover:bg-bci-magenta/90 transition-all hover:shadow-lg hover:shadow-bci-magenta/25"
            >
              Entrar
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-bci-dark">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-bci-dark via-bci-dark/95 to-bci-navy/40" />
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-bci-magenta/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-bci-blue/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-20 lg:px-12">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-bci-magenta/30 bg-bci-magenta/10 px-4 py-1.5 text-xs font-bold text-bci-magenta">
                <span className="h-2 w-2 rounded-full bg-bci-magenta animate-pulse" />
                Programa de Inclusão Financeira — Angola
              </div>

              <h1 className="mt-8 text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                Bankeiros{" "}
                <span className="bg-gradient-to-r from-bci-magenta to-pink-400 bg-clip-text text-transparent">
                  da Zunga
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
                Plataforma digital do BCI para abertura de contas no mercado informal,
                presença por GPS e acompanhamento operacional de toda a equipa.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-bci-magenta px-6 py-3.5 text-sm font-extrabold text-white hover:bg-bci-magenta/90 transition-all hover:shadow-xl hover:shadow-bci-magenta/30"
                >
                  Aceder à Plataforma
                  <ChevronRight size={18} />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-white/10 transition-all"
                >
                  Criar Conta
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="mt-1 text-xs font-semibold text-white/50">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Logo grande central */}
                <div className="h-80 w-80 rounded-3xl bg-gradient-to-br from-bci-magenta/20 to-bci-navy/20 p-8 backdrop-blur border border-white/10">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-40 w-40">
                      <BciLogo className="h-full w-full" />
                    </div>
                  </div>
                </div>
                {/* Decorative rings */}
                <div className="absolute -inset-8 -z-10 rounded-full border border-dashed border-white/5 animate-spin-slow" />
                <div className="absolute -inset-16 -z-20 rounded-full border border-dashed border-white/[3%] animate-spin-slower" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="bg-white px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.2em] text-bci-magenta">
            Plataforma Completa
          </p>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-bci-ink sm:text-4xl">
            Tudo o que precisa para operar
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-bci-muted">
            Do terreno à administração — uma solução integrada para o programa Bankeiros da Zunga.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-bci-line bg-white p-8 shadow-card transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${f.color} transition-transform group-hover:scale-110`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-bci-ink">{f.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-bci-muted">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="bg-bci-dark px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Aceda à plataforma e escolha a sua área de trabalho.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-bci-magenta px-6 py-3.5 text-sm font-extrabold text-white hover:bg-bci-magenta/90 transition-all"
            >
              Entrar no Sistema
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-white/10 transition-all"
            >
              Criar Nova Conta
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-bci-dark border-t border-white/5 px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 p-1">
              <BciLogo className="h-full w-full" />
            </div>
            <p className="text-xs font-semibold text-white/40">
              Bankeiros da Zunga — BCI © {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors">
              Entrar
            </Link>
            <Link href="/onboarding" className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors">
              Registar
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
