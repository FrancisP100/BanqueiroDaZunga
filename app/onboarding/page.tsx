import Link from "next/link";
import { ShieldCheck, UserRound, UsersRound } from "lucide-react";

const roles = [
  {
    href: "/banqueiro/register",
    title: "Banqueiro",
    subtitle: "Contas, presenca GPS e historico diario.",
    icon: UserRound,
    sample: "Ana Silva Domingos - BZ0174",
  },
  {
    href: "/chefe/register",
    title: "Chefe",
    subtitle: "Mapa, presencas, faltas e correcao manual.",
    icon: UsersRound,
    sample: "Carlos Manuel Vitor - CH-08",
  },
  {
    href: "/admin",
    title: "Administrador",
    subtitle: "Mercados, utilizadores e regras de pontualidade.",
    icon: ShieldCheck,
    sample: "Direccao BCI Inclusao - AD-01",
  },
];

export default function OnboardingPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative flex min-h-[360px] items-end overflow-hidden bg-bci-navy px-6 py-10 text-white lg:min-h-screen lg:px-12">
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(12,24,48,0.94),rgba(21,36,74,0.74)),url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Inclusao financeira - Angola
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl">
            Bankeiros da Zunga
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/82">
            MVP modular para abertura de contas no mercado, presenca por GPS e
            acompanhamento operacional por chefes e administradores.
          </p>
        </div>
      </section>

      <section className="flex items-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-bci-pink">
            Comece a registar-se
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-bci-ink">
            Escolha a sua area
          </h2>
          <div className="mt-8 grid gap-4">
            {roles.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className="group rounded-2xl border border-bci-line bg-white p-5 shadow-card transition hover:border-bci-pink hover:shadow-soft"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-bci-pinkSoft p-3 text-bci-pink group-hover:bg-bci-pink group-hover:text-white">
                    <role.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-bci-ink">
                      {role.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-bci-muted">
                      {role.subtitle}
                    </p>
                    <p className="mt-3 text-xs font-bold text-bci-muted">
                      Demo: {role.sample}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-sm text-bci-muted">
            <p>
              Ja tem uma conta?{" "}
              <Link href="/login" className="font-bold text-bci-pink">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
