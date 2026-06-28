'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function BanqueiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Não aplicar layout nas páginas de login/register
  if (pathname === '/banqueiro/login' || pathname === '/banqueiro/register') {
    return <>{children}</>;
  }
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
          <div className="relative w-full h-12 mb-2">
             <Image src="/logo.png" alt="BCI Logo" fill className="object-contain object-left" />
          </div>
          <p className="text-sm text-white/70">Banqueiro da Zumba</p>
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-bci-dark text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="relative w-24 h-8">
           <Image src="/logo.png" alt="BCI Logo" fill className="object-contain object-left" />
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
