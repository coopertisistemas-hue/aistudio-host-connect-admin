import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useState, useEffect } from 'react';

export type Organization = Tables<'organizations'>;

export const useOrg = () => {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    // ============================================================================
    // SUPER ADMIN: Fetch ALL organizations
    // ============================================================================
    const { data: allOrganizations, isLoading: allOrgsLoading } = useQuery<Organization[]>({
        queryKey: ['all-organizations'],
        queryFn: async () => {
            console.log('[useOrg] 🔑 Super admin mode: Fetching ALL organizations');

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('name');

            if (error) {
                console.error('[useOrg] ❌ Error fetching all organizations:', error);
                throw error;
            }

            console.log(`[useOrg] ✅ Fetched ${data?.length || 0} organizations for super admin`);
            return data || [];
        },
        enabled: isSuperAdmin && !!user?.id && !authLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // ============================================================================
    // REGULAR USER: Fetch user's organization
    // ============================================================================
    const { data: userOrganization, isLoading: userOrgLoading, error, refetch } = useQuery<Organization | null>({
        queryKey: ['organization', user?.id],
        queryFn: async () => {
            const startTime = performance.now();

            if (!user?.id) {
                console.log('[useOrg] ⏭️ No user, returning null');
                return null;
            }

            console.log('[useOrg] 🔍 Starting query for user:', user.id);
            console.log('[useOrg] 📧 User email:', user.email);

            try {
                // Log 1: Tentar buscar com log detalhado
                console.log('[useOrg] 🔎 Executing: SELECT * FROM organizations WHERE owner_id =', user.id);

                const { data, error: fetchError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                const queryTime = performance.now() - startTime;
                console.log(`[useOrg] ⏱️ Query completed in ${queryTime.toFixed(2)}ms`);

                // Log 2: Resultado da query
                console.log('[useOrg] 📦 Query result:', {
                    hasData: !!data,
                    hasError: !!fetchError,
                    errorCode: fetchError?.code,
                    errorMessage: fetchError?.message,
                    errorDetails: fetchError?.details
                });

                // Erro específico: RLS bloqueando
                if (fetchError) {
                    if (fetchError.code === '42501') { // Insufficient privilege
                        console.error('[useOrg] 🚫 RLS ERROR: User não tem permissão para ler organizations');
                        console.error('[useOrg] 💡 Solução: Verificar políticas RLS da tabela organizations');
                        throw new Error('RLS_PERMISSION_DENIED: Verifique as políticas de segurança');
                    }

                    if (fetchError.code !== 'PGRST116') { // Not found é OK
                        console.error('[useOrg] ❌ Supabase error:', fetchError);
                        throw fetchError;
                    }
                }

                // Sucesso
                if (data) {
                    console.log('[useOrg] ✅ Organization found:', {
                        id: data.id,
                        name: data.name,
                        owner_id: data.owner_id,
                        match: data.owner_id === user.id ? '✅' : '❌'
                    });
                    return data;
                }

                // Não encontrou - tentar criar
                console.warn('[useOrg] ⚠️ No organization found, creating default...');

                const defaultName = user.user_metadata?.full_name
                    ? `${user.user_metadata.full_name}'s Organization`
                    : user.email?.split('@')[0]
                        ? `${user.email.split('@')[0]}'s Organization`
                        : 'Minha Organização';

                console.log('[useOrg] 🏗️ Creating org with name:', defaultName);

                const { data: newOrg, error: createError } = await supabase
                    .from('organizations')
                    .insert({
                        owner_id: user.id,
                        name: defaultName,
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('[useOrg] ❌ Failed to create organization:', createError);

                    // Se já existe (race condition), buscar novamente
                    if (createError.code === '23505') {
                        console.log('[useOrg] 🔄 Duplicate detected, retrying fetch...');
                        const { data: retryData } = await supabase
                            .from('organizations')
                            .select('*')
                            .eq('owner_id', user.id)
                            .single();

                        if (retryData) {
                            console.log('[useOrg] ✅ Found on retry:', retryData.id);
                            return retryData;
                        }
                    }

                    throw createError;
                }

                console.log('[useOrg] ✅ Organization created:', newOrg.id);
                return newOrg;

            } catch (err: any) {
                console.error('[useOrg] 💥 Critical error:', {
                    message: err?.message,
                    code: err?.code,
                    details: err?.details,
                    hint: err?.hint
                });
                throw err;
            }
        },
        enabled: !isSuperAdmin && !!user?.id && !authLoading,
        retry: 1,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        meta: {
            errorMessage: 'Falha ao carregar organização'
        }
    });

    // ============================================================================
    // DETERMINE CURRENT ORGANIZATION
    // ============================================================================

    // Super admin: use selected org or first available
    // Regular user: use their organization
    const currentOrganization = isSuperAdmin
        ? (selectedOrgId
            ? allOrganizations?.find(o => o.id === selectedOrgId)
            : allOrganizations?.[0])
        : userOrganization;

    // Auto-select first org for super admin if none selected
    useEffect(() => {
        if (isSuperAdmin && allOrganizations && allOrganizations.length > 0 && !selectedOrgId) {
            console.log('[useOrg] 🎯 Auto-selecting first org for super admin:', allOrganizations[0].name);
            setSelectedOrgId(allOrganizations[0].id);
        }
    }, [isSuperAdmin, allOrganizations, selectedOrgId]);

    const isLoading = authLoading || (isSuperAdmin ? allOrgsLoading : (!!user && userOrgLoading));

    // Log consolidado do estado
    console.log('[useOrg] 📊 Hook State:', {
        authLoading,
        hasUser: !!user,
        userId: user?.id,
        isSuperAdmin,
        selectedOrgId,
        allOrgsCount: allOrganizations?.length,
        isLoading,
        hasOrg: !!currentOrganization,
        orgId: currentOrganization?.id,
        orgName: currentOrganization?.name,
        hasError: !!error
    });

    return {
        organization: currentOrganization || null,
        currentOrgId: currentOrganization?.id || null,
        isLoading,
        error,
        hasOrg: !!currentOrganization,
        isSuperAdmin,
        allOrganizations: allOrganizations || [],
        selectedOrgId,
        setSelectedOrgId,
        refetch,
    };
};
