'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Map, Users, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChefeDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    banqueiros: 0,
    presencasHoje: 0,
    faltasHoje: 0,
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

      const hoje = new Date().toISOString().split('T')[0];

      // 1. Total de banqueiros (simples, global ou por mercado)
      const { data: banqueiros } = await supabase
        .from('profiles')
        .select('id')
        .eq('papel', 'banqueiro');
        
      // 2. Presenças hoje (status no_local)
      const { data: presencas } = await supabase
        .from('presences')
        .select('status')
        .eq('data', hoje);

      const no_local = presencas?.filter(p => p.status === 'no_local').length || 0;
      const faltas = presencas?.filter(p => p.status === 'falta').length || 0;

      setStats({
        banqueiros: banqueiros?.length || 0,
        presencasHoje: no_local,
        faltasHoje: faltas,
      });

      setLoading(false);
    }
    loadStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="p-8">A carregar painel do chefe...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-bci-dark text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Painel do Chefe - BCI</h1>
        <Button variant="ghost" onClick={handleLogout} className="text-white hover:text-white hover:bg-white/10">
          <LogOut size={18} className="mr-2" /> Sair
        </Button>
      </header>
      
      <main className="p-8 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Resumo Diário</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Banqueiros</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.banqueiros}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <Map size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Presentes (No Local)</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.presencasHoje}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Faltas Hoje</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.faltasHoje}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Mapa de Presenças (Em Breve)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-100 rounded-b-xl border-t">
            <p className="text-gray-500 flex items-center">
              <Map className="mr-2" />
              A integração com Leaflet será disponibilizada na próxima fase.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
