'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, CheckCircle2, Clock, CreditCard, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import Link from 'next/link';

export default function BanqueiroDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContas: 0,
    tpaEntregues: 0,
    pacotesAtivos: 0, // In this MVP, we assume all 'aberta' are active packages
    pendentes: 0,
  });
  const [presencaHoje, setPresencaHoje] = useState<any>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, local_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch accounts stats
      const { data: accounts } = await supabase
        .from('accounts')
        .select('status, tem_tpa')
        .eq('banqueiro_id', profile.id);

      if (accounts) {
        const totais = accounts.length;
        const tpas = accounts.filter(a => a.tem_tpa).length;
        const abertas = accounts.filter(a => a.status === 'aberta').length;
        const pendentes = accounts.filter(a => a.status === 'pendente').length;

        setStats({
          totalContas: totais,
          tpaEntregues: tpas,
          pacotesAtivos: abertas,
          pendentes: pendentes,
        });
      }

      // Check presence for today
      const hoje = new Date().toISOString().split('T')[0];
      const { data: presenca } = await supabase
        .from('presences')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('data', hoje)
        .single();

      if (presenca) {
        setPresencaHoje(presenca);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const marcarPresenca = async () => {
    if (!navigator.geolocation) {
      alert("O seu navegador não suporta geolocalização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, local_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Basic logic for MVP: just save it. Advanced logic would check distance to market.
      // E.g., status: no_local
      const hoje = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0];

      const { error } = await supabase.from('presences').insert({
        profile_id: profile.id,
        data: hoje,
        entrada: hora,
        latitude,
        longitude,
        mercado_id: profile.local_id,
        status: 'no_local', // Simplification
        pontualidade: 'no_horario', // Simplification
        origem: 'gps'
      });

      if (!error) {
        alert("Presença marcada com sucesso!");
        window.location.reload();
      } else {
        alert("Erro ao marcar presença.");
      }
    });
  };

  const chartData = [
    { name: 'Com TPA', value: stats.tpaEntregues, color: '#e12275' }, // bci-magenta
    { name: 'Sem TPA', value: stats.totalContas - stats.tpaEntregues, color: '#1e3a3a' }, // bci-dark
  ];

  const statusData = [
    { name: 'Ativas', value: stats.pacotesAtivos, color: '#10b981' }, // emerald-500
    { name: 'Pendentes', value: stats.pendentes, color: '#f59e0b' }, // amber-500
  ];

  if (loading) {
    return <div className="flex h-64 items-center justify-center">A carregar dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bci-dark">Dashboard</h1>
          <p className="text-gray-500">Resumo da sua atividade de hoje</p>
        </div>
        
        {presencaHoje ? (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center font-medium">
            <CheckCircle2 className="mr-2" size={20} />
            Presença Registada ({presencaHoje.entrada.substring(0, 5)})
          </div>
        ) : (
          <Button onClick={marcarPresenca} className="bg-bci-magenta hover:bg-bci-magenta/90 text-white">
            <MapPin className="mr-2" size={18} />
            Marcar Presença (GPS)
          </Button>
        )}
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Contas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalContas}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-pink-100 text-bci-magenta rounded-full">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">TPA Entregues</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.tpaEntregues}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pacotes Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pacotesAtivos}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pendentes}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Distribuição TPA</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {stats.totalContas > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Status das Contas</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {stats.totalContas > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="mt-8">
        <Link href="/banqueiro/abrir-conta">
          <Button className="w-full sm:w-auto bg-bci-dark hover:bg-bci-dark/90 text-white font-semibold py-6 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
            <CreditCard className="mr-3" size={24} />
            Abrir Nova Conta
          </Button>
        </Link>
      </div>
    </div>
  );
}
