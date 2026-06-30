import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, UserRound, UsersRound } from "lucide-react";

const roles = [
  {
    href: "/banqueiro/register",
    title: "Bankeiro",
    subtitle: "Abertura de contas, presença GPS e histórico diário.",
    icon: UserRound,
  },
  {
    href: "/chefe/register",
    title: "Líder",
    subtitle: "Mapa de presenças, faltas e correcção manual.",
    icon: UsersRound,
  },
  {
    href: "/admin/login",
    title: "Administrador",
    subtitle: "Mercados, utilizadores e regras de pontualidade.",
    icon: ShieldCheck,
  },
];

export default function OnboardingPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      {/* Left — hero */}
      <section className="relative flex min-h-[360px] items-end overflow-hidden bg-bci-dark px-6 py-10 text-white lg:min-h-screen lg:px-12">
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            className="object-cover object-right opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bci-dark via-bci-dark/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/10">
              <Image src="/logo.png" alt="BCI Logo" fill className="object-contain p-1" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
            </div>
          </div>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Inclusão Financeira — Angola
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Bankeiros<br />
            <span className="text-bci-pink">da Zunga</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/65">
            Plataforma modular para abertura de contas no mercado, presença por
            GPS e acompanhamento operacional por chefes e administradores.
          </p>
        </div>
      </section>

      {/* Right — form */}
      <section className="flex items-center bg-bci-dark px-6 py-10 lg:px-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Comece a registar-se
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Escolha a sua área
          </h2>
          <div className="mt-8 grid gap-3">
            {roles.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-bci-pink hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-bci-pinkSoft p-3 text-bci-pink group-hover:bg-bci-pink group-hover:text-white transition-colors">
                    <role.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{role.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-white/55">{role.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-sm text-white/50">
            Já tem conta?{" "}
            <Link href="/login" className="font-bold text-bci-pink hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
