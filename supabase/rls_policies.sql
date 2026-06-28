-- Verificar estado do RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- OPÇÃO A: Desactivar RLS em todas as tabelas (mais simples para MVP)
-- Descomentar e executar se quiser desactivar completamente:
/*
ALTER TABLE profiles              DISABLE ROW LEVEL SECURITY;
ALTER TABLE markets               DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts              DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes              DISABLE ROW LEVEL SECURITY;
ALTER TABLE presences             DISABLE ROW LEVEL SECURITY;
ALTER TABLE punctuality_settings  DISABLE ROW LEVEL SECURITY;
*/

-- OPÇÃO B: Manter RLS mas permitir service_role fazer tudo (recomendado)
-- O service_role bypassa RLS por defeito no Supabase — não precisa de políticas.
-- Apenas adicionar políticas para acesso autenticado normal:

-- Profiles: utilizador pode ler/actualizar o seu próprio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- Markets: leitura pública, escrita apenas service_role
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "markets_select_all" ON markets;
CREATE POLICY "markets_select_all"
  ON markets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "markets_write_service" ON markets;
CREATE POLICY "markets_write_service"
  ON markets FOR ALL
  USING (auth.role() = 'service_role');

-- Accounts: banqueiro vê as suas próprias
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select"
  ON accounts FOR SELECT
  USING (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = banqueiro_id OR auth.role() = 'service_role');

-- Clientes: acesso autenticado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_authenticated" ON clientes;
CREATE POLICY "clientes_authenticated"
  ON clientes FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Presences: acesso autenticado
ALTER TABLE presences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presences_authenticated" ON presences;
CREATE POLICY "presences_authenticated"
  ON presences FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Punctuality settings: leitura pública, escrita service_role
ALTER TABLE punctuality_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "punctuality_select" ON punctuality_settings;
CREATE POLICY "punctuality_select"
  ON punctuality_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "punctuality_write_service" ON punctuality_settings;
CREATE POLICY "punctuality_write_service"
  ON punctuality_settings FOR ALL
  USING (auth.role() = 'service_role');
