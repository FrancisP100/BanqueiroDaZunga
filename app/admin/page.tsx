'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Users, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mercados: 0,
    utilizadores: 0,
  });
  
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: mCount } = await supabase.from('markets').select('*', { count: 'exact', head: true });

      setStats({
        mercados: mCount || 0,
        utilizadores: uCount || 0,
      });

      setLoading(false);
    }
    loadStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="p-8">A carregar painel de administração...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-bci-dark text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Administração Global - BCI</h1>
        <Button variant="ghost" onClick={handleLogout} className="text-white hover:text-white hover:bg-white/10">
          <LogOut size={18} className="mr-2" /> Sair
        </Button>
      </header>
      
      <main className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Store size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mercados Registados</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.mercados}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Utilizadores</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.utilizadores}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="p-3 bg-gray-200 text-gray-700 rounded-full">
                <Settings size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Regras de Pontualidade</p>
                <h3 className="text-base font-bold text-gray-900">Configurar</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 bg-white p-8 rounded-xl shadow-sm border text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Painel de Controlo</h3>
          <p className="text-gray-500 mb-6">As funcionalidades de gestão de entidades estarão disponíveis em breve.</p>
          <div className="flex justify-center gap-4">
            <Button disabled>Gerir Mercados</Button>
            <Button disabled>Gerir Utilizadores</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
