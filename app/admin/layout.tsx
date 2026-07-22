'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { LayoutDashboard, Users, UserCheck, Store, Bell, LogOut, Menu, X, ContactRound } from 'lucide-react';
import { BciLogo } from '@/components/ui/bci-logo';
import { getAllNotifications } from '@/app/admin/actions';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bankeiros', href: '/admin/banqueiros', icon: Users },
  { name: 'Líderes', href: '/admin/chefes', icon: UserCheck },
  { name: 'Clientes', href: '/admin/clientes', icon: ContactRound },
  { name: 'Mercados', href: '/admin/mercados', icon: Store },
  { name: 'Notificações', href: '/admin/notificacoes', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadNotifCount() {
      const res = await getAllNotifications();
      if (res.data) {
        setNotifCount(res.data.filter((n: any) => !n.lida).length);
      }
    }
    loadNotifCount();

    const interval = setInterval(loadNotifCount, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't apply layout on login page
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-bci-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bci-navy text-white fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/10 p-1.5 flex-shrink-0">
              <BciLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-tight">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">BCI</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mt-2">
            Administração
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className="mr-3 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.name === 'Notificações' && notifCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bci-magenta px-1.5 text-[10px] font-extrabold text-white">
                    {notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 w-full bg-bci-navy text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="h-11 w-11 rounded-xl bg-white/10 p-1.5">
          <BciLogo className="h-full w-full" />
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-10 pt-16 bg-bci-navy text-white">
          <nav className="px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors text-sm font-bold ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Notificações' && notifCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bci-magenta px-1.5 text-[10px] font-extrabold text-white">
                      {notifCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="px-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <LogOut size={18} className="mr-3" />
              Terminar Sessão
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
