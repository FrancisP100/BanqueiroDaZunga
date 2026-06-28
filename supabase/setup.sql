-- Script de setup completo — executar no SQL Editor do Supabase
-- Seguro para re-executar (usa IF NOT EXISTS e DO blocks para evitar duplicados)

-- 1. Tipos enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('banqueiro', 'chefe', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('aberta', 'pendente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE presence_status AS ENUM ('no_local', 'fora_do_local', 'falta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE punctuality_status AS ENUM ('no_horario', 'atraso', 'falta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE presence_origin AS ENUM ('gps', 'automatica', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  nome text NOT NULL,
  codigo_interno text NOT NULL UNIQUE,
  papel user_role NOT NULL,
  telefone text,
  provincia text,
  local_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabela markets
CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  provincia text NOT NULL,
  tipo text NOT NULL DEFAULT 'mercado',
  balcao text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  raio_metros integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. FK de profiles para markets (só adicionar se não existir)
DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_local_id_fkey
    FOREIGN KEY (local_id) REFERENCES markets(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Tabela clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bi text NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone text,
  celular text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabela accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banqueiro_id uuid NOT NULL REFERENCES profiles(id),
  cliente_id uuid NOT NULL REFERENCES clientes(id),
  pacote text NOT NULL,
  mercado_id uuid NOT NULL REFERENCES markets(id),
  status account_status NOT NULL DEFAULT 'aberta',
  tem_tpa boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Tabela presences
CREATE TABLE IF NOT EXISTS presences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  data date NOT NULL DEFAULT current_date,
  entrada time,
  saida time,
  latitude double precision,
  longitude double precision,
  mercado_id uuid REFERENCES markets(id),
  status presence_status NOT NULL,
  pontualidade punctuality_status NOT NULL,
  origem presence_origin NOT NULL DEFAULT 'gps',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, data)
);

-- 8. Tabela punctuality_settings
CREATE TABLE IF NOT EXISTS punctuality_settings (
  id boolean PRIMARY KEY DEFAULT true,
  hora_limite time NOT NULL DEFAULT '08:00',
  tolerancia_min integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_settings_row CHECK (id)
);

INSERT INTO punctuality_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- 9. Índices
CREATE INDEX IF NOT EXISTS accounts_banqueiro_created_idx ON accounts (banqueiro_id, created_at DESC);
CREATE INDEX IF NOT EXISTS accounts_cliente_idx ON accounts (cliente_id);
CREATE INDEX IF NOT EXISTS presences_data_idx ON presences (data DESC);
CREATE INDEX IF NOT EXISTS profiles_papel_idx ON profiles (papel);
CREATE INDEX IF NOT EXISTS clientes_bi_idx ON clientes (bi);

-- 10. Verificação final: listar tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
