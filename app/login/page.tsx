import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, UserRound, UsersRound, ArrowRight } from "lucide-react";

const roles = [
  {
    href: "/banqueiro/login",
    title: "Banqueiro",
    subtitle: "Abertura de contas, presença GPS e histórico diário.",
    icon: UserRound,
    accent: "text-bci-pink",
    bg: "bg-bci-pinkSoft",
    border: "hover:border-bci-pink",
  },
  {
    href: "/chefe/login",
    title: "Chefe",
    subtitle: "Mapa de presenças, faltas e correcção manual.",
    icon: UsersRound,
    accent: "text-bci-blue",
    bg: "bg-bci-blueSoft",
    border: "hover:border-bci-blue",
  },
  {
    href: "/admin/login",
    title: "Administrador",
    subtitle: "Gestão de mercados, utilizadores e regras de pontualidade.",
    icon: ShieldCheck,
    accent: "text-white",
    bg: "bg-white/10",
    border: "hover:border-white/40",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-bci-dark text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-bci-dark/95 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/10">
              <Image src="/logo.png" alt="BCI Logo" fill className="object-contain p-1" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-white/10"
          >
            Página Inicial
          </Link>
        </div>
      </nav>

      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Iniciar Sessão
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Escolha a sua<br />
            <span className="text-bci-pink">área de acesso</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/60">
            Selecione o seu papel na plataforma para aceder à área correspondente.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {roles.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className={`group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition ${role.border} hover:bg-white/10`}
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${role.bg} ${role.accent} group-hover:scale-110 transition-transform`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-white">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{role.subtitle}</p>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-white/40">Entrar</span>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center text-sm font-bold text-bci-pink hover:underline"
            >
              Não tem conta? Registar-se
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
