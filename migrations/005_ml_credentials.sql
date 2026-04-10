-- migrations/005_ml_credentials.sql
-- KINEXIS — Registro Seguro de Credenciales Mercado Libre (Kap Tools)

-- Nota: Para que estas funciones existan, pgsodium y vault deben estar habilitados en Supabase.

-- 1. App ID
SELECT vault.create_secret(
  '2563941731044265',
  'ml_app_id',
  'Mercado Libre App ID - Kap Tools'
);

-- 2. Client Secret
SELECT vault.create_secret(
  'vDQxAUGDo4jwDmi4VEyLB5UoXQWe8TP7',
  'ml_client_secret',
  'Mercado Libre Client Secret - Kap Tools'
);

-- 3. Comentario de Auditoría
COMMENT ON TABLE vault.secrets IS 'Contiene las claves sensibles de ML inyectadas durante la Fase 1B';
