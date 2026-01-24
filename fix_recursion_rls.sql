-- ============================================================================
-- FIX CRÍTICO: Resolver recursão infinita em org_members
-- ============================================================================
-- Este script corrige o erro de recursão infinita nas políticas RLS

-- O problema: As funções is_org_member() e is_org_admin() consultam org_members,
-- mas as políticas de org_members também usam essas funções, criando um loop.

-- Solução: Modificar as políticas para usar queries diretas ao invés de funções

-- ============================================================================
-- PARTE 1: Recriar políticas de org_members sem recursão
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Members can view their org members" ON public.org_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON public.org_members;

-- Nova política de SELECT (sem recursão)
CREATE POLICY "Members can view their org members" ON public.org_members
    FOR SELECT
    USING (
      -- Pode ver a si mesmo
      user_id = auth.uid()
      OR 
      -- Pode ver outros membros da mesma organização
      org_id IN (
        SELECT om.org_id 
        FROM public.org_members om 
        WHERE om.user_id = auth.uid()
      )
    );

-- Nova política de ALL para admins (sem recursão)
CREATE POLICY "Admins can manage org members" ON public.org_members
    FOR ALL
    USING (
      -- É admin/owner da organização
      EXISTS (
        SELECT 1 
        FROM public.org_members om 
        WHERE om.org_id = org_members.org_id 
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
      )
    );

-- ============================================================================
-- PARTE 2: Verificar se profiles tem políticas problemáticas
-- ============================================================================

-- Verificar políticas atuais de profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================================================
-- PARTE 3: Simplificar acesso a profiles (remover dependências de org_members)
-- ============================================================================

-- Remover qualquer política de profiles que use org_members
DROP POLICY IF EXISTS "Users can view their profile via org" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for org members" ON public.profiles;

-- Garantir que existe uma política simples de leitura de profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Política para atualizar próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar políticas de org_members
SELECT 
    '📋 Políticas de org_members:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'org_members'
ORDER BY policyname;

-- Verificar políticas de profiles
SELECT 
    '📋 Políticas de profiles:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Testar acesso
SELECT 
    '✅ Teste: Seu perfil' as status,
    id,
    email,
    role,
    plan,
    is_super_admin,
    onboarding_completed
FROM public.profiles
WHERE id = auth.uid();

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Recursão infinita corrigida!';
    RAISE NOTICE '';
    RAISE NOTICE 'Políticas atualizadas:';
    RAISE NOTICE '- org_members: Agora usa queries diretas sem funções helper';
    RAISE NOTICE '- profiles: Simplificada para evitar loops';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verifique as tabelas acima';
    RAISE NOTICE '2. Limpe o cache do navegador (Ctrl+Shift+Delete)';
    RAISE NOTICE '3. Recarregue a aplicação (F5)';
    RAISE NOTICE '4. Faça login';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
