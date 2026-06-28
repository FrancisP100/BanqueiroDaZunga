import Link from "next/link";
import { ShieldCheck, UserRound, UsersRound, ArrowRight } from "lucide-react";

const roles = [
  {
    href: "/banqueiro/login",
    title: "Banqueiro",
    subtitle: "Acesso à abertura de contas, presença GPS e histórico diário.",
    icon: UserRound,
    color: "bg-bci-pinkSoft text-bci-pink",
    border: "hover:border-bci-pink",
  },
  {
    href: "/chefe/login",
    title: "Chefe",
    subtitle: "Acesso ao mapa, presenças, faltas e correção manual.",
    icon: UsersRound,
    color: "bg-bci-blueSoft text-bci-blue",
    border: "hover:border-bci-blue",
  },
  {
    href: "/admin/login",
    title: "Administrador",
    subtitle: "Gestão de mercados, utilizadores e regras de pontualidade.",
    icon: ShieldCheck,
    color: "bg-bci-navySoft text-bci-navy",
    border: "hover:border-bci-navy",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-bci-line bg-white/92 px-6 py-4 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-bci-pink text-sm font-extrabold text-white">
              BCI
            </div>
            <p className="text-sm font-extrabold text-bci-ink">
              Banqueiros da Zumba
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-bci-navy px-5 py-2 text-sm font-extrabold text-white transition hover:bg-bci-navy/90"
          >
            Página Inicial
          </Link>
        </div>
      </nav>

      <section className="px-6 py-20 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Iniciar Sessão
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-bci-ink sm:text-6xl">
            Escolha a sua área de acesso
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-bci-muted">
            Selecione o seu papel na plataforma para aceder à área correspondente.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className={`group rounded-2xl border border-bci-line bg-white p-6 shadow-card transition ${role.border} hover:shadow-soft`}
              >
                <div className={`grid h-14 w-14 place-items-center rounded-xl ${role.color} group-hover:scale-110 transition-transform`}>
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-bci-ink">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-bci-muted">
                  {role.subtitle}
                </p>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-bci-muted">
                    Entrar
                  </span>
                  <ArrowRight className="h-4 w-4 text-bci-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
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