-- ============================================================
-- FIX RLS: Permitir que admin e líderes leiam dados necessários
-- ============================================================
-- Problema: As políticas antigas restringiam SELECT a "apenas o próprio perfil"
-- (auth.uid() = id), o que impedia admin de ver outros perfis e contas.
-- 
-- Solução: Permitir que qualquer utilizador autenticado leia perfis e contas,
-- mas restringir escritas. Para um MVP interno (BCI), isto é seguro.

-- ============================================================
-- 1. PROFILES
-- ============================================================
-- Antiga: auth.uid() = id OR auth.role() = 'service_role'
-- Nova: qualquer authenticated pode SELECT

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_auth"
  ON profiles FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Manter as políticas de escrita restritas
DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- ============================================================
-- 2. ACCOUNTS
-- ============================================================
-- Antiga: auth.uid() = banqueiro_id OR auth.role() = 'service_role'
-- Nova: qualquer authenticated pode SELECT (admin/líder vê relatórios)

DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select_auth"
  ON accounts FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Manter INSERT/UPDATE/DELETE restritos ao próprio banqueiro
DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "accounts_update_own" ON accounts;
CREATE POLICY "accounts_update_own"
  ON accounts FOR UPDATE
  USING (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "accounts_delete_own" ON accounts;
CREATE POLICY "accounts_delete_own"
  ON accounts FOR DELETE
  USING (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

-- ============================================================
-- 3. CLIENTES (já está correcto, manter)
-- ============================================================

-- ============================================================
-- 4. PRESENCES (já está correcto, manter)
-- ============================================================

-- ============================================================
-- 5. MARKETS (já está correcto, manter)
-- ============================================================

-- ============================================================
-- 6. PUNCTUALITY_SETTINGS (já está correcto, manter)
-- ============================================================

-- ============================================================
-- VERIFICAR POLÍTICAS APLICADAS
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
