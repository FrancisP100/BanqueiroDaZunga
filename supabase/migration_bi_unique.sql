-- Migração: Garantir UNIQUE constraint no BI da tabela clientes
-- Executar no SQL Editor do Supabase

-- ⚠️ ATENÇÃO: Se existirem BIs duplicados, esta migração:
--   1. Re-aponta as contas (accounts) para o registo de cliente mantido
--   2. Apaga os registos de cliente duplicados
--   3. Remove duplicados em notifications (cliente_id → NULL)
--   4. Adiciona a constraint UNIQUE

-- 1a. Re-apontar accounts que referenciam clientes duplicados para o registo mantido
UPDATE accounts a
SET cliente_id = keep.id_keep
FROM (
  SELECT min(id) as id_keep, bi
  FROM clientes
  GROUP BY bi
  HAVING count(*) > 1
) keep
WHERE a.cliente_id IN (
  SELECT c.id FROM clientes c
  WHERE c.bi = keep.bi AND c.id <> keep.id_keep
);

-- 1b. Remover referências em notifications (cliente_id → NULL) para FKs com SET NULL
UPDATE notifications n
SET cliente_id = NULL
WHERE n.cliente_id IN (
  SELECT c.id FROM clientes c
  WHERE c.bi IN (
    SELECT bi FROM clientes GROUP BY bi HAVING count(*) > 1
  )
  AND c.id <> (SELECT min(id) FROM clientes WHERE bi = c.bi)
);

-- 2. Remover BIs duplicados (manter o registo mais antigo — min(id))
DELETE FROM clientes c1 USING (
  SELECT min(id) as id_keep, bi
  FROM clientes
  GROUP BY bi
  HAVING count(*) > 1
) c2
WHERE c1.bi = c2.bi
  AND c1.id <> c2.id_keep;

-- 3. Garantir que o índice existe (não bloqueia se já existir)
CREATE INDEX IF NOT EXISTS clientes_bi_idx ON clientes (bi);

-- 4. Adicionar UNIQUE constraint — seguro de re-executar
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_bi_key;
ALTER TABLE clientes ADD CONSTRAINT clientes_bi_key UNIQUE (bi);

-- 5. Verificação
SELECT
  count(*) as total_clientes,
  count(distinct bi) as bics_unicos
FROM clientes;
