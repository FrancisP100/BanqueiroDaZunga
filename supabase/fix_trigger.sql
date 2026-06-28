-- Executar este script no SQL Editor do Supabase se o registo continuar a falhar
-- com "Database error creating new user"

-- 1. Verificar se existe algum trigger em auth.users que possa estar a causar erro
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Se existir um trigger chamado "on_auth_user_created" ou similar que tenta
--    inserir em profiles automaticamente, remover esse trigger:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verificar se a coluna codigo_interno tem uma constraint NOT NULL problemática
--    Se necessário, tornar opcional temporariamente:
-- ALTER TABLE profiles ALTER COLUMN codigo_interno DROP NOT NULL;

-- 4. Verificar utilizadores órfãos (em auth.users mas sem profiles):
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
