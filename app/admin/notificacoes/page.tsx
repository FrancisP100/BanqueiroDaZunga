'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCheck, Inbox, ArrowLeft } from 'lucide-react';
import NotificationCard from '@/components/notification-card';
import type { Notification } from '@/lib/types';
import Link from 'next/link';
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

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

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

      {/* Acções */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-bci-muted">
          <Inbox size={16} />
          <span>
            {loading ? '…' : `${notificacoes.length} notificaç${notificacoes.length === 1 ? 'ão' : 'ões'} ao total`}
          </span>
          {naoLidas > 0 && (
            <span className="rounded-full bg-bci-magenta px-2.5 py-0.5 text-xs font-bold text-white">
              {naoLidas} nova{naoLidas > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {naoLidas > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bci-line bg-white px-4 py-2 text-sm font-bold text-bci-magenta hover:bg-bci-magenta/5 transition-colors"
          >
            <CheckCheck size={16} />
            Marcar todas lidas
          </button>
        )}
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
          {mappedNotifs.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
