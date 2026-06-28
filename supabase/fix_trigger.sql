-- DIAGNÓSTICO 1: Ver todas as constraints da tabela profiles
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles'
  AND nsp.nspname = 'public';

-- DIAGNÓSTICO 2: Ver colunas e se aceitam NULL
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- DIAGNÓSTICO 3: Tentar inserir um utilizador de teste directamente
-- (substitui o uuid por um uuid real da tabela auth.users se tiveres algum)
-- INSERT INTO public.profiles (id, email, nome, codigo_interno, papel, ativo)
-- VALUES (gen_random_uuid(), 'teste@bci.ao', 'Teste User', 'TST-001', 'banqueiro', true);

-- DIAGNÓSTICO 4: Ver se o tipo enum user_role existe e tem os valores correctos
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
WHERE pg_type.typname = 'user_role';

-- DIAGNÓSTICO 5: Ver se há algum trigger em public.profiles
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles';
