-- Tabela de notificações: líderes enviam alertas para banqueiros sobre TPAs pendentes
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references profiles(id),
  banqueiro_id uuid not null references profiles(id),
  cliente_nome text not null,
  conta_id uuid references accounts(id),
  mensagem text not null default 'Cliente com TPA pendente — por favor dar seguimento.',
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists notifications_banqueiro_idx on notifications (banqueiro_id, lida, created_at desc);
create index if not exists notifications_leader_idx on notifications (leader_id, created_at desc);

-- RLS: leitura para o banqueiro dono, escrita para líder (via service_role)
alter table notifications enable row level security;

drop policy if exists "notifications_select_banqueiro" on notifications;
create policy "notifications_select_banqueiro"
  on notifications for select
  using (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

drop policy if exists "notifications_insert_leader" on notifications;
create policy "notifications_insert_leader"
  on notifications for insert
  with check (auth.role() = 'service_role');

drop policy if exists "notifications_update_banqueiro" on notifications;
create policy "notifications_update_banqueiro"
  on notifications for update
  using (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

-- Trigger para marcar como lida
drop policy if exists "notifications_delete_service" on notifications;
create policy "notifications_delete_service"
  on notifications for delete
  using (auth.role() = 'service_role');
