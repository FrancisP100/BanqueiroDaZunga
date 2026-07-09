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

interface ContasData {
  nome: string;
  contas: number;
}

interface AssiduidadeData {
  nome: string;
  presencas: number;
  faltas: number;
}

export function AdminCharts() {
  const [contasSemana, setContasSemana] = useState<ContasData[]>([]);
  const [assiduidade, setAssiduidade] = useState<AssiduidadeData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    async function load() {
      try {
        // Contas dos ultimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const since = sevenDaysAgo.toISOString();

        const { data: accounts } = await supabase
          .from('accounts')
          .select('created_at')
          .gte('created_at', since);

        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const contasPorDia: Record<string, number> = {};
        const hoje = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = new Date(hoje);
          d.setDate(hoje.getDate() - i);
          const key = diasSemana[d.getDay()];
          contasPorDia[key] = 0;
        }

        (accounts ?? []).forEach((a: { created_at: string }) => {
          const d = new Date(a.created_at);
          const key = diasSemana[d.getDay()];
          if (contasPorDia[key] !== undefined) contasPorDia[key]++;
        });

        setContasSemana(
          Object.entries(contasPorDia).map(([nome, contas]) => ({ nome, contas })),
        );

        // Assiduidade por mercado
        const { data: presencesHoje } = await supabase
          .from('presences')
          .select('status, mercado_id, markets(nome)')
          .eq('data', new Date().toISOString().split('T')[0]);

        const { data: markets } = await supabase
          .from('markets')
          .select('id, nome');

        const presencasPorMercado: Record<string, { total: number; presentes: number }> = {};

        (markets ?? []).forEach((m: { id: string; nome: string }) => {
          if (!presencasPorMercado[m.nome]) {
            presencasPorMercado[m.nome] = { total: 0, presentes: 0 };
          }
        });

        (presencesHoje ?? []).forEach((p: any) => {
          const nome = Array.isArray(p.markets) ? (p.markets[0]?.nome ?? '-') : (p.markets?.nome ?? '-');
          if (!presencasPorMercado[nome]) presencasPorMercado[nome] = { total: 0, presentes: 0 };
          presencasPorMercado[nome].total++;
          if (p.status === 'no_local') presencasPorMercado[nome].presentes++;
        });

        setAssiduidade(
          Object.entries(presencasPorMercado).map(([nome, data]) => ({
            nome,
            presencas: data.total > 0 ? Math.round((data.presentes / data.total) * 100) : 0,
            faltas: data.total > 0 ? 100 - Math.round((data.presentes / data.total) * 100) : 0,
          })),
        );
      } catch (err) {
        console.error('Erro ao carregar dados dos graficos:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-bci-muted">
        A carregar dados dos graficos...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Grafico 1: Abertura de Contas */}
      <div className="rounded-xl border border-bci-line bg-gray-50/50 p-4">
        <h3 className="mb-4 text-sm font-bold text-bci-ink">
          Abertura de Contas (Ultimos 7 dias)
        </h3>
        <div className="h-64 w-full">
          {contasSemana.length === 0 || contasSemana.every((d) => d.contas === 0) ? (
            <div className="flex h-full items-center justify-center text-sm text-bci-muted">
              Sem dados de contas para o periodo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={contasSemana}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="contas"
                  name="Contas Abertas"
                  stroke="#0f4a8a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f4a8a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grafico 2: Assiduidade por Mercado */}
      <div className="rounded-xl border border-bci-line bg-gray-50/50 p-4">
        <h3 className="mb-4 text-sm font-bold text-bci-ink">
          Assiduidade por Mercado/Lider (%)
        </h3>
        <div className="h-64 w-full">
          {assiduidade.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-bci-muted">
              Sem dados de presenca para hoje.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={assiduidade}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="presencas"
                  name="Presencas %"
                  fill="#0f4a8a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="faltas"
                  name="Faltas %"
                  fill="#9ca3af"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}