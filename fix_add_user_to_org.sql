-- ============================================================================
-- FIX RÁPIDO: Adicionar você como owner da sua organização
-- ============================================================================
-- Execute este script no Supabase SQL Editor estando LOGADO na aplicação

-- 1. Corrigir política RLS
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT
    USING (
      owner_id = auth.uid() 
      OR 
      public.is_org_member(id)
    );

-- 2. Adicionar você em org_members da sua organização
INSERT INTO public.org_members (org_id, user_id, role)
SELECT 
    '63489650-68ee-4593-9f06-544bbec80339'::uuid, -- Sua org ID
    'cfc38522-8687-4066-bb9c-6dbcc465396f'::uuid, -- Seu user ID
    'owner'
WHERE NOT EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE org_id = '63489650-68ee-4593-9f06-544bbec80339'::uuid 
    AND user_id = 'cfc38522-8687-4066-bb9c-6dbcc465396f'::uuid
);

-- 3. Verificação
SELECT 
    '✅ SUCESSO! Sua configuração:' as status,
    o.id as org_id,
    o.name as org_name,
    om.role as your_role,
    om.created_at as added_at
FROM public.organizations o
LEFT JOIN public.org_members om ON om.org_id = o.id AND om.user_id = 'cfc38522-8687-4066-bb9c-6dbcc465396f'::uuid
WHERE o.id = '63489650-68ee-4593-9f06-544bbec80339'::uuid;

-- ============================================================================
-- Você deve ver:
-- - org_name: cooperti sistemas's Organization
-- - your_role: owner
-- - added_at: [data de agora]
-- ============================================================================
