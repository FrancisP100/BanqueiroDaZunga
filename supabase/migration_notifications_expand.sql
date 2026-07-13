-- Expansão do sistema de notificações: tipos, descrição, links e nome do líder
alter table notifications
  add column if not exists tipo text not null default 'alerta_tpa',
  add column if not exists descricao text,
  add column if not exists cliente_id uuid references clientes(id),
  add column if not exists leader_nome text;

-- Índices adicionais para consultas por tipo e cliente
create index if not exists notifications_tipo_idx on notifications (tipo);
create index if not exists notifications_cliente_idx on notifications (cliente_id);

-- Remover default depois de migrados os dados existentes
alter table notifications alter column tipo drop default;

-- Comentários nas colunas
comment on column notifications.tipo is 'Tipo de notificação: alerta_tpa | abertura_conta | tpa_entregue';
comment on column notifications.descricao is 'Descrição detalhada da notificação';
comment on column notifications.cliente_id is 'ID do cliente associado (opcional)';
comment on column notifications.leader_nome is 'Nome do líder que enviou a notificação';
