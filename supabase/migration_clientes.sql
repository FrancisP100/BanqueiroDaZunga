-- Script de Migração: Gestão de Clientes e TPA

-- 1. Criar a nova tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid primary key default gen_random_uuid(),
  bi text not null unique,
  nome text not null,
  telefone text,
  celular text,
  endereco text,
  created_at timestamptz not null default now()
);

-- 2. Alterar a tabela accounts
-- Removemos as antigas colunas que agora pertencem a "clientes"
ALTER TABLE accounts DROP COLUMN IF EXISTS cliente_nome CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS bi CASCADE;
ALTER TABLE accounts DROP COLUMN IF EXISTS telefone CASCADE;

-- Adicionamos a nova coluna para relacionar com clientes (deixamos temporariamente sem "not null" para não dar erro se existirem registos antigos)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS cliente_id uuid references clientes(id);

-- Adicionamos a coluna TPA
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tem_tpa boolean not null default false;

-- 3. Criar os novos índices
CREATE INDEX IF NOT EXISTS accounts_cliente_idx ON accounts (cliente_id);
CREATE INDEX IF NOT EXISTS clientes_bi_idx ON clientes (bi);
