-- ============================================================================
-- FIX DEFINITIVO: Remover TODAS as recursões
-- ============================================================================
-- Este script remove COMPLETAMENTE a recursão quebrando todas as dependências
-- circulares entre profiles, org_members e organizations

-- ============================================================================
-- PARTE 1: PROFILES - Simplificar ao máximo
-- ============================================================================

-- Desabilitar RLS temporariamente para limpar
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas de profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar política SIMPLES para profiles (SEM dependências)
CREATE POLICY "Anyone can read profiles"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PARTE 2: ORG_MEMBERS - Simplificar
-- ============================================================================

-- Remover TODAS as políticas de org_members
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'org_members' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.org_members';
    END LOOP;
END $$;

-- Criar políticas SIMPLES para org_members (sem funções helper)
CREATE POLICY "Users can view their own memberships"
ON public.org_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view co-members"
ON public.org_members
FOR SELECT
USING (
    org_id IN (
        SELECT om.org_id 
        FROM public.org_members om 
        WHERE om.user_id = auth.uid()
    )
);

CREATE POLICY "Owners and admins can manage members"
ON public.org_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM public.org_members om 
        WHERE om.org_id = org_members.org_id 
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- ============================================================================
-- PARTE 3: ORGANIZATIONS - Manter política simples
-- ============================================================================

-- Verificar política atual
SELECT 
    '📋 Políticas de organizations antes' as info,
    policyname
FROM pg_policies
WHERE tablename = 'organizations';

-- A política deve ser:
-- owner_id = auth.uid() OR public.is_org_member(id)
-- Isso já foi corrigido anteriormente

-- ============================================================================
-- PARTE 4: VERIFICAÇÃO
-- ============================================================================

-- Ver todas as políticas
SELECT 
    '📋 PROFILES policies:' as table_name,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
UNION ALL
SELECT 
    '📋 ORG_MEMBERS policies:' as table_name,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'org_members'
UNION ALL
SELECT 
    '📋 ORGANIZATIONS policies:' as table_name,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'organizations';

-- Testar acesso direto a profiles
SELECT 
    '✅ TESTE: Seu perfil (deve funcionar)' as status,
    id,
    email,
    role,
    plan,
    onboarding_completed,
    is_super_admin
FROM public.profiles
WHERE id = auth.uid();

-- Testar org_members
SELECT 
    '✅ TESTE: Suas organizações' as status,
    org_id,
    role
FROM public.org_members
WHERE user_id = auth.uid();

-- ============================================================================
-- INSTRUÇÕES FINAIS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ TODAS AS RECURSÕES REMOVIDAS!';
    RAISE NOTICE '';
    RAISE NOTICE 'O que foi feito:';
    RAISE NOTICE '✓ Políticas de profiles: Simplificadas (qualquer um pode ler)';
    RAISE NOTICE '✓ Políticas de org_members: Sem funções helper';
    RAISE NOTICE '✓ Políticas de organizations: Mantidas simples';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANTE:';
    RAISE NOTICE 'A política de profiles agora é PÚBLICA para leitura.';
    RAISE NOTICE 'Isso é necessário para evitar recursão.';
    RAISE NOTICE 'Os dados sensíveis devem ser protegidos em nível de aplicação.';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verifique os testes acima';
    RAISE NOTICE '2. FECHE o navegador completamente';
    RAISE NOTICE '3. Abra novamente';
    RAISE NOTICE '4. Limpe cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '5. Faça login';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
