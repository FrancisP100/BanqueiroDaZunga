-- Limpar utilizadores em auth.users que não têm perfil em profiles
-- (ficaram de tentativas de registo falhadas)

-- 1. Ver utilizadores órfãos
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Apagar utilizadores órfãos do auth
-- ATENÇÃO: Só executar depois de confirmar a lista acima
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN public.profiles p ON p.id = au.id
--   WHERE p.id IS NULL
-- );
