'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
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

export default function NotificacoesRecebidasPage() {
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar notificações onde banqueiro_id = user.id (o líder recebe notificações com o seu ID)
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('banqueiro_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!cancelled) setNotificacoes(notifs ?? []);
      } catch (err) {
        console.error('Erro ao carregar notificações:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('id', id);

    if (!error) {
      setNotificacoes((prev: any[]) =>
        prev.map((n: any) => (n.id === id ? { ...n, lida: true } : n)),
      );
    }
  }

  async function handleMarkAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('banqueiro_id', user.id)
      .eq('lida', false);

    if (!error) {
      setNotificacoes((prev: any[]) =>
        prev.map((n: any) => ({ ...n, lida: true })),
      );
    }
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
          href="/chefe"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-bci-muted hover:text-bci-blue transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bci-blue/70">
          Notificações Recebidas
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-bci-ink">
          Caixa de Entrada
        </h1>
        <p className="mt-2 text-sm text-bci-muted">
          Notificações enviadas pelos seus Bankeiros — TPAs entregues, aberturas de conta e outros alertas.
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
            {loading ? '…' : `${filteredNotifs.length} de ${notificacoes.length}`}
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
            Nenhuma notificação recebida.
          </p>
          <p className="text-xs text-bci-muted mt-1">
            Quando os seus Bankeiros marcarem TPAs como entregues, as notificações aparecerão aqui.
          </p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="rounded-2xl border border-bci-line bg-white py-12 text-center shadow-card">
          <BellOff className="mx-auto h-10 w-10 text-bci-muted" />
          <p className="mt-3 text-sm font-bold text-bci-muted">
            Nenhuma notificação deste tipo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((notif) => (
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
