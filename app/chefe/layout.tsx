'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { LayoutDashboard, ClipboardList, Users, Bell, LogOut, Menu, X } from 'lucide-react';
import { BciLogo } from '@/components/ui/bci-logo';

const navItems = [
  { name: 'Dashboard', href: '/chefe', icon: LayoutDashboard },
  { name: 'Presenças', href: '/chefe/presencas', icon: ClipboardList },
  { name: 'Bankeiros', href: '/chefe/banqueiros', icon: Users },
  { name: 'Alertas TPAs', href: '/chefe/notificacoes', icon: Bell },
];

export default function ChefeLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't apply layout on login/register pages
  if (pathname === '/chefe/login' || pathname === '/chefe/register') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bci-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bci-dark text-white fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-white/10 p-1.5 flex-shrink-0">
              <BciLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white leading-tight">Bankeiros da Zunga</p>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">BCI</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mt-2">
            Líder de Zona
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
                    ? 'bg-bci-blue text-white shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className="mr-3 flex-shrink-0" />
                {item.name}
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-bci-dark text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="relative w-24 h-8">
          <Image src="/Logo1.png" alt="BCI Logo" fill className="object-contain object-left" />
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-10 pt-16 bg-bci-dark text-white">
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
                      ? 'bg-bci-blue text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {item.name}
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
