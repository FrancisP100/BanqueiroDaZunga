'use client';

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
  Legend
} from 'recharts';

// Interfaces de tipagem para resolver os avisos do TypeScript
interface PerformanceData {
  nome: string;
  contas: number;
}

interface AssiduidadeData {
  nome: string;
  presencas: number;
  faltas: number;
}

// Dados com a chave "nome" suportada pela interface
const bankeirosPerformance: PerformanceData[] = [
  { nome: 'Seg', contas: 12 },
  { nome: 'Ter', contas: 25 },
  { nome: 'Qua', contas: 18 },
  { nome: 'Qui', contas: 30 },
  { nome: 'Sex', contas: 22 },
  { nome: 'Sáb', contas: 15 },
];

const lideresPerformance: AssiduidadeData[] = [
  { nome: 'Luanda', presencas: 95, faltas: 5 },
  { nome: 'Viana', presencas: 88, faltas: 12 },
  { nome: 'Talatona', presencas: 92, faltas: 8 },
  { nome: 'Cazenga', presencas: 85, faltas: 15 },
];

export function AdminCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {/* Gráfico 1: Desempenho Bankeiros */}
      <div className="rounded-xl border border-bci-line bg-gray-50/50 p-4">
        <h3 className="mb-4 text-sm font-bold text-bci-ink">Abertura de Contas (Últimos 6 dias)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bankeirosPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
        </div>
      </div>

      {/* Gráfico 2: Desempenho Líderes */}
      <div className="rounded-xl border border-bci-line bg-gray-50/50 p-4">
        <h3 className="mb-4 text-sm font-bold text-bci-ink">Assiduidade por Mercado/Líder (%)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lideresPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="presencas" name="Presenças" fill="#0f4a8a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="faltas" name="Faltas" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}