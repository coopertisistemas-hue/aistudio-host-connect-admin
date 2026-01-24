-- ============================================================================
-- FIX CRÍTICO: Corrigir política RLS para permitir owner_id
-- ============================================================================
-- Este script corrige o travamento no login permitindo que usuários
-- vejam organizações onde são owner_id OU members

-- Execute no Supabase SQL Editor

-- 1. Remover política antiga
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- 2. Criar nova política que permite ver por owner_id OU por membership
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT
    USING (
      owner_id = auth.uid() -- ✅ Permite ver se é owner
      OR
      public.is_org_member(id) -- ✅ OU se é membro
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Teste se você consegue ver sua organização:
SELECT id, name, owner_id, created_at
FROM public.organizations
WHERE owner_id = auth.uid();

-- Se retornar sua organização, o problema está resolvido!
