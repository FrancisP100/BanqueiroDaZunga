-- Migration: Sincronização Líder-Banqueiros
-- Adiciona coluna leader_id à tabela profiles para estabelecer
-- uma relação explícita entre um líder (chefe) e os seus banqueiros.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS leader_id uuid REFERENCES profiles(id);

-- Índice para consultas rápidas: "quem são os banqueiros deste líder?"
CREATE INDEX IF NOT EXISTS profiles_leader_id_idx
  ON profiles (leader_id)
  WHERE leader_id IS NOT NULL;

-- Índice para: "qual é o líder deste banqueiro?"
CREATE INDEX IF NOT EXISTS profiles_leader_lookup_idx
  ON profiles (id, leader_id)
  WHERE papel = 'banqueiro';
