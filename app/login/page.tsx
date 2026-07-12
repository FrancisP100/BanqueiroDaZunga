import Link from "next/link";
import { ShieldCheck, UserRound, UsersRound, ArrowRight } from "lucide-react";
import { BciLogo } from "@/components/ui/bci-logo";

const roles = [
  {
    href: "/banqueiro/login",
    title: "Bankeiro",
    subtitle: "Abertura de contas, presença GPS e histórico diário.",
    description: "Acesso à área operacional para registo de presenças e gestão de clientes.",
    icon: UserRound,
    color: "bg-bci-magenta",
    lightBg: "bg-bci-magenta/10",
    borderHover: "hover:border-bci-magenta/50",
    iconBg: "bg-bci-magenta/15 text-bci-magenta",
    groupHover: "group-hover:bg-bci-magenta group-hover:text-white",
  },
  {
    href: "/chefe/login",
    title: "Líder",
    subtitle: "Relatórios de desempenho e alertas de TPAs pendentes.",
    description: "Painel de gestão de equipa e monitoramento dos Bankeiros do seu balcão.",
    icon: UsersRound,
    color: "bg-bci-blue",
    lightBg: "bg-bci-blue/10",
    borderHover: "hover:border-bci-blue/50",
    iconBg: "bg-bci-blue/15 text-bci-blue",
    groupHover: "group-hover:bg-bci-blue group-hover:text-white",
  },
  {
    href: "/admin/login",
    title: "Administrador",
    subtitle: "Gestão de mercados, utilizadores e regras de pontualidade.",
    description: "Controlo global do programa Bankeiros da Zunga.",
    icon: ShieldCheck,
    color: "bg-bci-navy",
    lightBg: "bg-bci-navy/10",
    borderHover: "hover:border-bci-navy/50",
    iconBg: "bg-bci-navy/15 text-bci-navy",
    groupHover: "group-hover:bg-bci-navy group-hover:text-white",
  },
];

export default function LoginSelectorPage() {
  return (
    <main className="min-h-screen bg-bci-dark flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-bci-dark/95 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 p-1.5">
              <BciLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">BCI</p>
            </div>
          </Link>
          <Link
            href="/onboarding"
            className="text-sm font-bold text-white/60 hover:text-white transition-colors"
          >
            Registar-se
          </Link>
        </div>
      </nav>

      {/* Conteúdo central */}
      <section className="flex-1 flex items-center justify-center px-6 py-16 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          {/* Header */}
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-magenta">
              Bankeiros da Zunga — BCI
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Como pretende{" "}
              <span className="text-bci-magenta">entrar?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/50">
              Selecione o seu perfil para aceder à área correspondente.
            </p>
          </div>

          {/* Role Cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link
                  key={role.href}
                  href={role.href}
                  className={`group relative rounded-2xl border border-white/10 ${role.lightBg} p-8 backdrop-blur transition-all ${role.borderHover} hover:shadow-xl hover:-translate-y-1`}
                >
                  {/* Número decorativo */}
                  <div className="absolute top-4 right-4 text-4xl font-extrabold text-white/[3%] select-none">
                    0{roles.indexOf(role) + 1}
                  </div>

                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${role.iconBg} ${role.groupHover} transition-all`}>
                    <Icon size={32} />
                  </div>

                  <h3 className="mt-6 text-2xl font-extrabold text-white">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-white/70">
                    {role.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/40">
                    {role.description}
                  </p>

                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-white/40 group-hover:text-white transition-colors">
                    Entrar
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 lg:px-12">
        <p className="text-center text-xs font-semibold text-white/30">
          Banco de Comércio e Indústria — BCI © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
