-- Seed: Mercados de demonstração
-- Executar no SQL Editor do Supabase

INSERT INTO markets (id, nome, provincia, tipo, balcao, latitude, longitude, raio_metros)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mercado do 30',                'Luanda',   'mercado', 'BCI-0030', -8.9256,  13.3612, 100),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Mercado do Kikolo',             'Luanda',   'mercado', 'BCI-0142', -8.7865,  13.2847, 100),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Mercado 4 de Abril - Rocha',    'Benguela', 'mercado', 'BCI-0405', -12.5763, 13.4035, 100)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserção
SELECT id, nome, provincia FROM markets ORDER BY nome;
