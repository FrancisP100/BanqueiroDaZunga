-- Migration: Adicionar colunas que estão no schema.sql mas faltam na base de dados live
-- Executar no SQL Editor do Supabase Dashboard

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS numero_balcao text;

-- clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bi_emissao date;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bi_validade date;

-- accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tpa_status text NOT NULL DEFAULT 'pendente';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hora_abertura time;

-- presences
ALTER TABLE presences ADD COLUMN IF NOT EXISTS observacao text;
ALTER TABLE presences ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Verificar se todas as colunas foram adicionadas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('numero_balcao', 'bi_emissao', 'bi_validade', 'tpa_status', 'hora_abertura', 'observacao', 'updated_at')
ORDER BY table_name, column_name;
