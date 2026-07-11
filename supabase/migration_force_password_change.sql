-- Migration: Forçar alteração de senha no primeiro login
-- Adiciona coluna force_password_change à tabela profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;

-- Trigger para marcar force_password_change = true quando um banqueiro é criado
-- (Segurança extra — o código da aplicação também define o valor)

CREATE OR REPLACE FUNCTION set_force_password_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.papel = 'banqueiro' AND OLD IS NULL THEN
    NEW.force_password_change := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger à tabela profiles
DROP TRIGGER IF EXISTS trg_force_password_change ON profiles;
CREATE TRIGGER trg_force_password_change
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_force_password_change();

-- Índice para consultas rápidas de perfis com senha por alterar
CREATE INDEX IF NOT EXISTS profiles_force_password_change_idx
  ON profiles (force_password_change)
  WHERE force_password_change = true;
