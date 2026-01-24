-- ============================================================================
-- FIX CRÍTICO: Adicionar coluna is_super_admin
-- ============================================================================
-- Este script corrige o erro 500 que está impedindo o login
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Adicionar coluna is_super_admin
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- 2. Adicionar índice para performance (apenas valores TRUE)
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
ON public.profiles(is_super_admin) 
WHERE is_super_admin = true;

-- 3. Adicionar comentário de documentação
COMMENT ON COLUMN public.profiles.is_super_admin IS 
'HostConnect team members with cross-organizational access for support. Only set via direct SQL.';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Depois de executar, confirme que a coluna foi criada:
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'is_super_admin';

-- Resultado esperado:
-- column_name      | data_type | is_nullable | column_default
-- is_super_admin   | boolean   | YES         | false
