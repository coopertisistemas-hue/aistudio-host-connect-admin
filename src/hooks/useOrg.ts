import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Organization = Tables<'organizations'>;

export const useOrg = () => {
    const { user, loading: authLoading } = useAuth();

    const { data: organization, isLoading: isQueryLoading, error, refetch } = useQuery<Organization | null>({
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
        enabled: !!user?.id && !authLoading,
        retry: 1, // Reduzido para falhar rápido
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        // Adicionar timeout de 15s
        meta: {
            errorMessage: 'Falha ao carregar organização'
        }
    });

    const isLoading = authLoading || (!!user && isQueryLoading);

    // Log consolidado do estado
    console.log('[useOrg] 📊 Hook State:', {
        authLoading,
        hasUser: !!user,
        userId: user?.id,
        isQueryLoading,
        hasOrg: !!organization,
        orgId: organization?.id,
        isLoading,
        hasError: !!error
    });

    return {
        organization,
        currentOrgId: organization?.id || null,
        isLoading,
        error,
        hasOrg: !!organization,
        refetch,
    };
};
