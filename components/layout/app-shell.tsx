import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AppShellProps = {
  title: string;
  eyebrow: string;
  userName: string;
  userMeta: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export function AppShell({
  title,
  eyebrow,
  userName,
  userMeta,
  navItems,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bci-bg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-bci-line bg-white px-5 py-6 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-bci-pink text-sm font-extrabold text-white shadow-pink">
            BCI
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight text-bci-ink">
              Bankeiros
            </p>
            <p className="text-xs font-semibold text-bci-muted">da Zunga</p>
          </div>
        </Link>

        <nav className="mt-9 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-bci-muted transition hover:bg-bci-pinkSoft hover:text-bci-pink"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-bci-line bg-white/92 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-pink">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-bci-ink">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-bci-ink">{userName}</p>
                <p className="text-xs text-bci-muted">{userMeta}</p>
              </div>
              <Link
                href="/login"
                className="grid h-10 w-10 place-items-center rounded-xl border border-bci-line bg-white text-bci-muted hover:text-bci-pink"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
