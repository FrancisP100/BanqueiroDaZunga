'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCheck, Inbox, ArrowLeft, AlertTriangle, UserPlus, CheckCircle, KeyRound, Smartphone } from 'lucide-react';
import NotificationCard from '@/components/notification-card';
import type { Notification, NotificationType } from '@/lib/types';
import Link from 'next/link';

const FILTER_OPTIONS: { value: NotificationType | 'todas'; label: string; icon: React.ElementType; color: string; activeColor: string }[] = [
  { value: 'todas', label: 'Todas', icon: Bell, color: 'text-gray-500', activeColor: 'bg-gray-900 text-white' },
  { value: 'alerta_tpa', label: 'Alerta TPA', icon: AlertTriangle, color: 'text-amber-600', activeColor: 'bg-amber-600 text-white' },
  { value: 'abertura_conta', label: 'Abertura Conta', icon: UserPlus, color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white' },
  { value: 'tpa_entregue', label: 'TPA Entregue', icon: CheckCircle, color: 'text-blue-600', activeColor: 'bg-blue-600 text-white' },
  { value: 'conta_ativada', label: 'Conta Activada', icon: KeyRound, color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white' },
  { value: 'tpa_no_balcao', label: 'TPA no Balcão', icon: Smartphone, color: 'text-blue-600', activeColor: 'bg-blue-600 text-white' },
];
import {
  getAllNotifications,
  adminMarcarNotificacaoLida,
  adminMarcarTodasLidas,
} from '@/app/admin/actions';

export default function AdminNotificacoesPage() {
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    const res = await getAllNotifications();
    if (res.data) {
      setNotificacoes(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkAsRead(id: string) {
    await adminMarcarNotificacaoLida(id);
    setNotificacoes((prev: any[]) =>
      prev.map((n: any) => (n.id === id ? { ...n, lida: true } : n)),
    );
  }

  async function handleMarkAllAsRead() {
    await adminMarcarTodasLidas();
    setNotificacoes((prev: any[]) =>
      prev.map((n: any) => ({ ...n, lida: true })),
    );
  }

  // Mapear registos do DB para o tipo Notification
  const mappedNotifs: Notification[] = notificacoes.map((n: any) => ({
    id: n.id,
    leaderId: n.leader_id,
    banqueiroId: n.banqueiro_id,
    clienteNome: n.cliente_nome,
    clienteId: n.cliente_id ?? undefined,
    contaId: n.conta_id ?? undefined,
    mensagem: n.mensagem,
    tipo: n.tipo ?? 'alerta_tpa',
    descricao: n.descricao ?? undefined,
    leaderNome: n.leader_nome ?? undefined,
    lida: n.lida,
    createdAt: n.created_at,
  }));

  const [tipoFiltro, setTipoFiltro] = useState<NotificationType | 'todas'>('todas');

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  // Aplicar filtro por tipo
  const filteredNotifs = tipoFiltro === 'todas'
    ? mappedNotifs
    : mappedNotifs.filter((n) => n.tipo === tipoFiltro);

  const contagemPorTipo = {
    todas: notificacoes.length,
    alerta_tpa: notificacoes.filter((n) => n.tipo === 'alerta_tpa').length,
    abertura_conta: notificacoes.filter((n) => n.tipo === 'abertura_conta').length,
    tpa_entregue: notificacoes.filter((n) => n.tipo === 'tpa_entregue').length,
    conta_ativada: notificacoes.filter((n) => n.tipo === 'conta_ativada').length,
    tpa_no_balcao: notificacoes.filter((n) => n.tipo === 'tpa_no_balcao').length,
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-navy transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-navy/60">
          Notificações Globais
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Caixa de Entrada
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Todas as notificações do sistema — alertas de TPA, aberturas de conta e TPAs entregues.
        </p>
      </div>

      {/* Filtro por tipo */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = tipoFiltro === opt.value;
          const count = contagemPorTipo[opt.value as keyof typeof contagemPorTipo] ?? 0;
          return (
            <button
              key={opt.value}
              onClick={() => setTipoFiltro(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? `${opt.activeColor} shadow-md`
                  : `${opt.color} bg-white border border-bci-line hover:shadow-sm hover:-translate-y-0.5`
              }`}
            >
              <Icon size={15} />
              {opt.label}
              {count > 0 && (
                <span className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-sm text-bci-muted">
          <Inbox size={16} />
          <span>
            {filteredNotifs.length} de {loading ? '…' : notificacoes.length}
          </span>
          {naoLidas > 0 && (
            <span className="rounded-full bg-bci-magenta px-2.5 py-0.5 text-xs font-bold text-white">
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </span>
          )}
          {naoLidas > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="ml-2 inline-flex items-center gap-1 rounded-xl border border-bci-line bg-white px-3 py-1.5 text-xs font-bold text-bci-magenta hover:bg-bci-magenta/5 transition-colors"
            >
              <CheckCheck size={13} />
              Marcar todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificações */}
      {loading ? (
        <div className="py-20 text-center text-sm text-bci-muted">
          A carregar notificações...
        </div>
      ) : mappedNotifs.length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-20 text-center shadow-card">
          <BellOff className="mx-auto h-12 w-12 text-bci-muted" />
          <p className="mt-4 text-sm font-bold text-bci-muted">
            Nenhuma notificação no sistema.
          </p>
          <p className="text-xs text-bci-muted mt-1">
            As notificações aparecerão aqui à medida que forem geradas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="rounded-2xl border border-bci-line bg-white py-12 text-center shadow-card">
              <BellOff className="mx-auto h-10 w-10 text-bci-muted" />
              <p className="mt-3 text-sm font-bold text-bci-muted">
                Nenhuma notificação deste tipo.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
