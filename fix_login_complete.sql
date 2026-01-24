-- ============================================================================
-- FIX COMPLETO: Resolver travamento no login
-- ============================================================================
-- Este script resolve TODOS os problemas que impedem o login
-- Execute no Supabase SQL Editor

-- ============================================================================
-- PARTE 1: Verificar estado atual
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando configuração atual...';
END $$;

-- Ver todas as organizações
SELECT 
    '📊 Organizações existentes' as info,
    id, 
    name, 
    owner_id, 
    created_at
FROM public.organizations
ORDER BY created_at DESC
LIMIT 10;

-- Ver membros de organizações
SELECT 
    '👥 Membros de organizações' as info,
    om.id,
    om.org_id,
    om.user_id,
    om.role,
    o.name as org_name
FROM public.org_members om
LEFT JOIN public.organizations o ON o.id = om.org_id
ORDER BY om.created_at DESC
LIMIT 10;

-- ============================================================================
-- PARTE 2: Corrigir política RLS da tabela organizations
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🔧 Corrigindo política RLS de organizations...';
END $$;

-- Remover política antiga
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Criar nova política que permite ver por owner_id OU por membership
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT
    USING (
      owner_id = auth.uid() -- ✅ Permite ver se é owner
      OR
      public.is_org_member(id) -- ✅ OU se é membro
    );

-- ============================================================================
-- PARTE 3: Garantir que usuário atual tenha uma organização
-- ============================================================================
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    user_org_id uuid;
    user_org_name text;
    created_org_id uuid;
BEGIN
    -- Pegar ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Você não está autenticado. Faça login primeiro.';
        RETURN;
    END IF;

    -- Pegar email do usuário
    SELECT email INTO current_user_email
    FROM auth.users
    WHERE id = current_user_id;

    RAISE NOTICE '👤 Usuário atual: % (%)', current_user_email, current_user_id;

    -- Verificar se já tem organização
    SELECT id, name INTO user_org_id, user_org_name
    FROM public.organizations
    WHERE owner_id = current_user_id
    LIMIT 1;

    IF user_org_id IS NOT NULL THEN
        RAISE NOTICE '✅ Usuário já possui organização: % (ID: %)', user_org_name, user_org_id;
        
        -- Verificar se está em org_members
        IF NOT EXISTS (
            SELECT 1 FROM public.org_members 
            WHERE org_id = user_org_id 
            AND user_id = current_user_id
        ) THEN
            RAISE NOTICE '🔧 Adicionando usuário como owner em org_members...';
            INSERT INTO public.org_members (org_id, user_id, role)
            VALUES (user_org_id, current_user_id, 'owner');
            RAISE NOTICE '✅ Usuário adicionado como owner em org_members';
        ELSE
            RAISE NOTICE '✅ Usuário já está em org_members';
        END IF;
    ELSE
        -- Criar organização
        RAISE NOTICE '🏗️ Criando organização para o usuário...';
        
        INSERT INTO public.organizations (name, owner_id)
        VALUES (
            COALESCE(
                (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = current_user_id),
                split_part(current_user_email, '@', 1)
            ) || '''s Organization',
            current_user_id
        )
        RETURNING id INTO created_org_id;

        -- Adicionar como owner em org_members
        INSERT INTO public.org_members (org_id, user_id, role)
        VALUES (created_org_id, current_user_id, 'owner');

        RAISE NOTICE '✅ Organização criada com sucesso! ID: %', created_org_id;
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Verificação final
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Script concluído! Verificando resultado...';
END $$;

-- Mostrar organização do usuário atual
SELECT 
    '✅ Sua organização' as status,
    o.id,
    o.name,
    o.owner_id,
    o.created_at,
    (SELECT role FROM public.org_members WHERE org_id = o.id AND user_id = auth.uid()) as your_role
FROM public.organizations o
WHERE o.owner_id = auth.uid()
   OR public.is_org_member(o.id);

-- ============================================================================
-- INSTRUÇÕES FINAIS
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SCRIPT CONCLUÍDO!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '1. Verifique as tabelas acima para confirmar que sua organização existe';
    RAISE NOTICE '2. Limpe o cache do navegador (Ctrl+Shift+Delete)';
    RAISE NOTICE '3. Recarregue a aplicação (F5)';
    RAISE NOTICE '4. Tente fazer login novamente';
    RAISE NOTICE '';
    RAISE NOTICE 'Se ainda tiver problemas, copie TODA a saída deste script e me envie!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
