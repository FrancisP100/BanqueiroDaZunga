-- Migration: Primeira presença GPS
-- Adiciona coluna `primeira_presenca` à tabela presences para identificar
-- a primeira vez que um banqueiro marcou presença (onde as coordenadas GPS do mercado são guardadas)

ALTER TABLE presences
ADD COLUMN IF NOT EXISTS primeira_presenca boolean NOT NULL DEFAULT false;

-- Índice para consultas rápidas: "já marcou presença alguma vez?"
CREATE INDEX IF NOT EXISTS presences_primeira_idx
  ON presences (profile_id, primeira_presenca)
  WHERE primeira_presenca = true;
