-- Script para corrigir as falhas de Segurança (RLS) identificadas no MVP

-- 1. Tabela: PROFILES
-- O problema atual é que "profiles_select_auth" permite a qualquer pessoa ler todos os perfis, anulando a política correta "profiles_select_visibility".
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;

-- 2. Tabela: ACCOUNTS
-- O problema atual é que "accounts_select_auth" permite a leitura global. Vamos restringir para que um banqueiro só veja as suas contas.
-- Para o Chefe/Admin, poderemos criar uma função de verificação, mas para manter a performance do MVP, vamos garantir que o dono da conta tem acesso garantido.
DROP POLICY IF EXISTS "accounts_select_auth" ON accounts;
CREATE POLICY "accounts_select_own" ON accounts FOR SELECT USING (
  (auth.uid() = banqueiro_id) OR 
  (auth.role() = 'service_role') OR
  (current_user_role() IN ('chefe', 'admin')) -- Assume a função current_user_role() existe conforme visto na policy de profiles
);

-- 3. Tabela: PRESENCES
-- A política "presences_authenticated" dava permissão de leitura/escrita a TUDO para QUALQUER UM.
DROP POLICY IF EXISTS "presences_authenticated" ON presences;

CREATE POLICY "presences_select_own" ON presences FOR SELECT USING (
  (auth.uid() = profile_id) OR 
  (auth.role() = 'service_role') OR
  (current_user_role() IN ('chefe', 'admin'))
);

CREATE POLICY "presences_insert_own" ON presences FOR INSERT WITH CHECK (
  (auth.uid() = profile_id) OR 
  (auth.role() = 'service_role')
);

CREATE POLICY "presences_update_own" ON presences FOR UPDATE USING (
  (auth.uid() = profile_id) OR 
  (auth.role() = 'service_role')
);

CREATE POLICY "presences_delete_own" ON presences FOR DELETE USING (
  (auth.uid() = profile_id) OR 
  (auth.role() = 'service_role')
);

-- 4. Tabela: CLIENTES
-- Como os Banqueiros precisam pesquisar clientes pelo BI globalmente (para saber se o cliente já existe),
-- o SELECT pode continuar aberto para autenticados. Mas vamos proteger contra DELETE.
DROP POLICY IF EXISTS "clientes_authenticated" ON clientes;

CREATE POLICY "clientes_select_auth" ON clientes FOR SELECT USING (
  auth.role() IN ('authenticated', 'service_role')
);
CREATE POLICY "clientes_insert_auth" ON clientes FOR INSERT WITH CHECK (
  auth.role() IN ('authenticated', 'service_role')
);
CREATE POLICY "clientes_update_auth" ON clientes FOR UPDATE USING (
  auth.role() IN ('authenticated', 'service_role')
);
-- Removemos a permissão de DELETE para contas normais
CREATE POLICY "clientes_delete_service" ON clientes FOR DELETE USING (
  auth.role() = 'service_role'
);
