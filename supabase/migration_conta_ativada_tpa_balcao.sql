-- Migration: Adicionar campos para conta activada com ID bancário e estado intermédio TPA no balcão

-- 1. Novo campo para número de conta real do banco (preenchido pelo líder ao activar)
alter table accounts
  add column if not exists numero_conta_banco text,
  add column if not exists data_activacao_banco date;

-- 2. Índice opcional para consultas por número de conta
create index if not exists accounts_numero_conta_idx on accounts (numero_conta_banco);

-- Comentários
comment on column accounts.numero_conta_banco is 'Número real da conta no sistema bancário (preenchido pelo líder)';
comment on column accounts.data_activacao_banco is 'Data de activação da conta no banco (preenchida pelo líder)';
