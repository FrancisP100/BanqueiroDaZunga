'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X } from 'lucide-react';
import { BciLogo } from '@/components/ui/bci-logo';

export default function BanqueiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Supabase client must be created before any conditional returns (React hooks rules)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Não aplicar layout nas páginas de login/register
  if (pathname === '/banqueiro/login' || pathname === '/banqueiro/register') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/banqueiro', icon: LayoutDashboard },
    { name: 'Abrir Conta', href: '/banqueiro/abrir-conta', icon: UserPlus },
    { name: 'Meus Clientes', href: '/banqueiro/clientes', icon: Users },
  ];


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
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
          <p className="text-sm text-white/70 mt-2">Bankeiro da Zunga</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-bci-magenta text-white font-medium shadow-md' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Terminar Sessão
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 w-full bg-bci-dark text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="h-9 w-9 rounded-xl bg-white/10 p-1.5">
          <BciLogo className="h-full w-full" />
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-10 pt-16 bg-bci-dark text-white">
          <nav className="px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-bci-magenta text-white font-medium' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <LogOut size={20} className="mr-3" />
              Sair
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
