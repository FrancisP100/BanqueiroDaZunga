import Link from "next/link";
import { ShieldCheck, UserRound, UsersRound, ArrowRight } from "lucide-react";
import { BciLogo } from "@/components/ui/bci-logo";

const roles = [
  {
    href: "/banqueiro/login",
    title: "Bankeiro",
    subtitle: "Abertura de contas, presença GPS e histórico diário.",
    icon: UserRound,
  },
  {
    href: "/chefe/login",
    title: "Líder",
    subtitle: "Mapa de presenças, faltas e correcção manual.",
    icon: UsersRound,
  },
  {
    href: "/admin/login",
    title: "Administrador",
    subtitle: "Gestão de mercados, utilizadores e regras de pontualidade.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bci-dark text-white flex flex-col">
      {/* Nav minimalista */}
      <nav className="border-b border-white/10 bg-bci-dark/95 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 p-1.5">
              <BciLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo central */}
      <section className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-4xl w-full text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Bankeiros da Zunga — BCI
          </p>
          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Como pretende<br />
            <span className="text-bci-pink">entrar?</span>
          </h1>
          <p className="mt-4 max-w-lg mx-auto text-lg text-white/60">
            Selecione o seu perfil para aceder à área correspondente.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto">
            {roles.map((role, index) => (
              <Link
                key={role.href}
                href={role.href}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10 hover:border-white/20"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                  index === 0
                    ? "bg-bci-pinkSoft text-bci-pink"
                    : index === 1
                    ? "bg-bci-blueSoft text-bci-blue"
                    : "bg-white/10 text-white"
                }`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-white">{role.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{role.subtitle}</p>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-white/40">Entrar</span>
                  <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
