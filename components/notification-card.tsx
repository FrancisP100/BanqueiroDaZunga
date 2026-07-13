"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Bell, UserPlus, ExternalLink, CheckCheck } from "lucide-react";
import { Notification } from "@/lib/types";

const TIPO_CONFIG = {
  alerta_tpa: {
    label: "Alerta de TPA",
    icon: Bell,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-400",
  },
  abertura_conta: {
    label: "Abertura de Conta",
    icon: UserPlus,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-400",
  },
  tpa_entregue: {
    label: "TPA Entregue",
    icon: CheckCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-400",
  },
} as const;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tipo = notification.tipo ?? "alerta_tpa";
  const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.alerta_tpa;
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 ease-in-out overflow-hidden ${
        notification.lida
          ? "border-bci-line bg-white"
          : "border-bci-magenta/30 bg-bci-magenta/[0.04]"
      }`}
    >
      {/* Header — clicável para expandir */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 focus:outline-none group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Ícone do tipo */}
            <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon size={16} className={config.color} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Tipo + badge de não lida */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                {!notification.lida && (
                  <span className="h-2 w-2 rounded-full bg-bci-magenta animate-pulse shrink-0" />
                )}
              </div>

              {/* Mensagem */}
              <p className={`text-sm mt-1 truncate ${
                notification.lida ? "text-gray-600" : "font-bold text-gray-900"
              }`}>
                {notification.mensagem}
              </p>

              {/* Data/Hora (sempre visível) */}
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[11px] text-gray-400">
                  {new Date(notification.createdAt).toLocaleString("pt-PT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {/* Indicador de expansão */}
                <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">
                  {expanded ? (
                    <span className="inline-flex items-center gap-0.5"><ChevronUp size={12} /> menos</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5"><ChevronDown size={12} /> mais</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Botão marcar lida */}
          {!notification.lida && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="shrink-0 rounded-lg bg-bci-magenta/10 px-2.5 py-1 text-[11px] font-bold text-bci-magenta hover:bg-bci-magenta hover:text-white transition-all duration-200"
            >
              <CheckCheck size={14} className="inline mr-0.5" />
              Lida
            </button>
          )}
        </div>
      </button>

      {/* Expanded Details — com animação suave */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-0 border-t border-bci-line/50 mx-4 space-y-3">
          {/* Grid de detalhes */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3">
            {/* Origem (Líder) */}
            {notification.leaderNome && (
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Origem
                </span>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {notification.leaderNome}
                </p>
              </div>
            )}

            {/* Cliente */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Cliente
              </span>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {notification.clienteNome}
              </p>
            </div>

            {/* Tipo */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Tipo
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Icon size={13} className={config.color} />
                <p className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </p>
              </div>
            </div>

            {/* Data/Hora completa */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Data e Hora
              </span>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {new Date(notification.createdAt).toLocaleString("pt-PT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Descrição detalhada */}
          {notification.descricao && (
            <div className="pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                Descrição
              </span>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                {notification.descricao}
              </p>
            </div>
          )}

          {/* Link para o cliente */}
          {notification.clienteId && (
            <div className="pt-1">
              <Link
                href={`/banqueiro/clientes/${notification.clienteId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-bci-magenta hover:text-bci-magenta/70 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
                Ver ficha do cliente
              </Link>
            </div>
          )}

          {/* Se não tiver clienteId mas tiver contaId, link para clientes */}
          {!notification.clienteId && notification.contaId && (
            <div className="pt-1">
              <Link
                href={"/banqueiro/clientes"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-bci-magenta hover:text-bci-magenta/70 transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
                Ver lista de clientes
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
