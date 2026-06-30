'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

type DailyAccounts = { name: string; contas: number };
type MarketAttendance = { name: string; presencas: number; faltas: number };

export function AdminCharts() {
  const [bankeirosData, setBankeirosData] = useState<DailyAccounts[]>([]);
  const [lideresData, setLideresData] = useState<MarketAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // === 1. Contas Abertas por Dia (Últimos 6 dias) ===
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const dailyMap: Record<string, number> = {};
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        accountsData?.forEach((acc) => {
          const date = new Date(acc.created_at);
          const dayName = days[date.getDay()];
          dailyMap[dayName] = (dailyMap[dayName] || 0) + 1;
        });

        const last6Days = days.slice(1).map((name) => ({
          name,
          contas: dailyMap[name] || 0,
        }));

        setBankeirosData(last6Days);

        // === 2. Assiduidade por Mercado (Presenças vs Faltas) ===
        const { data: presencesData } = await supabase
          .from('presences')
          .select('status, markets(nome)')
          .eq('data', new Date().toISOString().split('T')[0]); // Hoje

        const marketStats: Record<string, { pres: number; total: number }> = {};

        presencesData?.forEach((p) => {
          const marketName = p.markets?.nome || 'Sem Mercado';
          if (!marketStats[marketName]) {
            marketStats[marketName] = { pres: 0, total: 0 };
          }
          marketStats[marketName].total += 1;
          if (p.status === 'no_local') marketStats[marketName].pres += 1;
        });

        const attendanceData = Object.entries(marketStats).map(([name, stats]) => ({
          name: name.length > 12 ? name.substring(0, 12) + '...' : name,
          presencas: stats.total > 0 ? Math.round((stats.pres / stats.total) * 100) : 0,
          faltas: stats.total > 0 ? Math.round(100 - (stats.pres / stats.total) * 100) : 0,
        }));

        setLideresData(attendanceData.length > 0 ? attendanceData : [
          { name: 'Sem dados', presencas: 0, faltas: 0 }
        ]);

      } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return <div className="py-10 text-center text-bci-muted">A carregar gráficos...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Abertura de Contas */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="mb-6">
          <h3 className="text-lg font-extrabold text-bci-ink">Abertura de Contas</h3>
          <p className="text-sm text-bci-muted">Últimos 6 dias</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bankeirosData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="contas"
                stroke="#0f4a8a"
                strokeWidth={3.5}
                dot={{ r: 5, fill: '#0f4a8a', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Assiduidade por Mercado */}
      <div className="rounded-2xl border border-bci-line bg-white p-6 shadow-card">
        <div className="mb-6">
          <h3 className="text-lg font-extrabold text-bci-ink">Assiduidade por Mercado</h3>
          <p className="text-sm text-bci-muted">Hoje</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lideresData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="presencas" name="Presenças (%)" fill="#0f4a8a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="faltas" name="Faltas (%)" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}