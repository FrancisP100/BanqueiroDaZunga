-- =============================================================================
-- Migração: Adicionar ON DELETE CASCADE / SET NULL a todas as FKs
-- =============================================================================
-- Todas as FKs foram criadas sem ON DELETE, causando erros de violação
-- ao eliminar registos. Esta migração corrige isso.
-- =============================================================================

-- 1. profiles.local_id → markets(id) — se o mercado for apagado, limpar a ref
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_local_id_fkey,
  ADD  CONSTRAINT profiles_local_id_fkey
    FOREIGN KEY (local_id) REFERENCES markets(id)
    ON DELETE SET NULL;

-- 2. profiles.leader_id → profiles(id) — se o líder for apagado, desvincular
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_leader_id_fkey,
  ADD  CONSTRAINT profiles_leader_id_fkey
    FOREIGN KEY (leader_id) REFERENCES profiles(id)
    ON DELETE SET NULL;

-- 3. accounts.banqueiro_id → profiles(id)
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_banqueiro_id_fkey,
  ADD  CONSTRAINT accounts_banqueiro_id_fkey
    FOREIGN KEY (banqueiro_id) REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 4. accounts.cliente_id → clientes(id)
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_cliente_id_fkey,
  ADD  CONSTRAINT accounts_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON DELETE CASCADE;

-- 5. accounts.mercado_id → markets(id)
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_mercado_id_fkey,
  ADD  CONSTRAINT accounts_mercado_id_fkey
    FOREIGN KEY (mercado_id) REFERENCES markets(id)
    ON DELETE SET NULL;

-- 6. presences.profile_id → profiles(id)
ALTER TABLE presences
  DROP CONSTRAINT IF EXISTS presences_profile_id_fkey,
  ADD  CONSTRAINT presences_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 7. presences.mercado_id → markets(id)
ALTER TABLE presences
  DROP CONSTRAINT IF EXISTS presences_mercado_id_fkey,
  ADD  CONSTRAINT presences_mercado_id_fkey
    FOREIGN KEY (mercado_id) REFERENCES markets(id)
    ON DELETE SET NULL;

-- 8. notifications.leader_id → profiles(id)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_leader_id_fkey,
  ADD  CONSTRAINT notifications_leader_id_fkey
    FOREIGN KEY (leader_id) REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 9. notifications.banqueiro_id → profiles(id)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_banqueiro_id_fkey,
  ADD  CONSTRAINT notifications_banqueiro_id_fkey
    FOREIGN KEY (banqueiro_id) REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 10. notifications.conta_id → accounts(id)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_conta_id_fkey,
  ADD  CONSTRAINT notifications_conta_id_fkey
    FOREIGN KEY (conta_id) REFERENCES accounts(id)
    ON DELETE CASCADE;

-- 11. notifications.cliente_id → clientes(id)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_cliente_id_fkey,
  ADD  CONSTRAINT notifications_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    ON DELETE SET NULL;
