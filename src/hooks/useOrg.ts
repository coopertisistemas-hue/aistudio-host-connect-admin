import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useState, useEffect } from 'react';

export type Organization = Tables<'organizations'>;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
};

export const useOrg = () => {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

    const { data: allOrganizations, isLoading: allOrgsLoading } = useQuery<Organization[]>({
        queryKey: ['all-organizations'],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('name');

                if (error) {
                    console.error('[useOrg] Error fetching all organizations:', error);
                    throw error;
                }
                return await withTimeout(Promise.resolve(data || []), 8000, 'ALL_ORGS_QUERY');
            } catch (err) {
                console.error('[useOrg] allOrganizations failed:', err);
                return [];
            }
        },
        enabled: isSuperAdmin && !!user?.id && !authLoading,
        staleTime: 2 * 60 * 1000,
    });

    const { data: userOrganization, isLoading: userOrgLoading, error, refetch } = useQuery<Organization | null>({
        queryKey: ['organization', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                return null;
            }

            try {
                // Step 1: fast-path via RPC. If it times out/fails, continue with fallback queries.
                let currentOrgId: string | null = null;
                try {
                    const currentOrgResponse = await withTimeout(
                        supabase.rpc('current_org_id'),
                        4000,
                        'CURRENT_ORG_RPC'
                    );
                    const currentOrgError = currentOrgResponse.error;
                    if (currentOrgError && currentOrgError.code !== 'PGRST116') {
                        console.warn('[useOrg] current_org_id RPC error, falling back:', currentOrgError.message);
                    } else {
                        currentOrgId = currentOrgResponse.data;
                    }
                } catch (rpcError) {
                    console.warn('[useOrg] current_org_id RPC timeout/failure, falling back');
                }

                if (currentOrgId) {
                    const orgByIdResponse = await withTimeout(
                        supabase
                            .from('organizations')
                            .select('*')
                            .eq('id', currentOrgId)
                            .maybeSingle(),
                        8000,
                        'ORG_BY_ID_QUERY'
                    );

                    if (orgByIdResponse.error && orgByIdResponse.error.code !== 'PGRST116') {
                        console.warn('[useOrg] orgById failed, continuing fallback:', orgByIdResponse.error.message);
                    } else if (orgByIdResponse.data) {
                        return orgByIdResponse.data;
                    }
                }

                const ownerOrgResponse = await withTimeout(
                    supabase
                        .from('organizations')
                        .select('*')
                        .eq('owner_id', user.id)
                        .limit(1)
                        .maybeSingle(),
                    8000,
                    'OWNER_ORG_QUERY'
                );

                if (ownerOrgResponse.error && ownerOrgResponse.error.code !== 'PGRST116') {
                    console.warn('[useOrg] ownerOrg query failed:', ownerOrgResponse.error.message);
                } else if (ownerOrgResponse.data) {
                    return ownerOrgResponse.data;
                }

                try {
                    const membershipResponse = await withTimeout(
                        supabase
                            .from('org_members')
                            .select('org_id, created_at')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .maybeSingle(),
                        3000,
                        'ORG_MEMBERSHIP_QUERY'
                    );

                    if (membershipResponse.error && membershipResponse.error.code !== 'PGRST116') {
                        console.warn('[useOrg] membership query failed, continuing fallback:', membershipResponse.error.message);
                    } else {
                        const membershipOrgId = membershipResponse.data?.org_id;
                        if (membershipOrgId) {
                            const memberOrgResponse = await withTimeout(
                                supabase
                                    .from('organizations')
                                    .select('*')
                                    .eq('id', membershipOrgId)
                                    .maybeSingle(),
                                5000,
                                'MEMBER_ORG_QUERY'
                            );

                            if (memberOrgResponse.error && memberOrgResponse.error.code !== 'PGRST116') {
                                console.warn('[useOrg] memberOrg query failed, continuing fallback:', memberOrgResponse.error.message);
                            } else if (memberOrgResponse.data) {
                                return memberOrgResponse.data;
                            }
                        }
                    }
                } catch {
                    console.warn('[useOrg] membership fallback timed out; continuing create_organization fallback');
                }

                const defaultName = user.user_metadata?.full_name
                    ? `${user.user_metadata.full_name}'s Organization`
                    : user.email?.split('@')[0]
                        ? `${user.email.split('@')[0]}'s Organization`
                        : 'Minha Organizacao';

                const createOrgResponse = await withTimeout(
                    supabase.rpc('create_organization', { org_name: defaultName }),
                    8000,
                    'CREATE_ORG_RPC'
                );

                const createError = createOrgResponse.error;
                const rpcResult = createOrgResponse.data;

                if (createError) {
                    if (createError.code === '23505') {
                        const retryMembershipResponse = await withTimeout(
                            supabase
                                .from('org_members')
                                .select('org_id, created_at')
                                .eq('user_id', user.id)
                                .order('created_at', { ascending: true })
                                .limit(1)
                                .maybeSingle(),
                            8000,
                            'RETRY_MEMBERSHIP_QUERY'
                        );

                        const retryMembership = retryMembershipResponse.data;

                        if (retryMembership?.org_id) {
                            const retryOrgResponse = await withTimeout(
                                supabase
                                    .from('organizations')
                                    .select('*')
                                    .eq('id', retryMembership.org_id)
                                    .maybeSingle(),
                                8000,
                                'RETRY_ORG_QUERY'
                            );

                            const retryOrg = retryOrgResponse.data;

                            if (retryOrg) {
                                return retryOrg;
                            }
                        }
                    }

                    console.error('[useOrg] Unable to create organization via RPC:', createError);
                    return null;
                }

                const createdOrgId = (rpcResult as { id?: string } | null)?.id;
                if (!createdOrgId) {
                    console.warn('[useOrg] create_organization RPC returned no id');
                    return null;
                }

                const createdOrgResponse = await withTimeout(
                    supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', createdOrgId)
                        .maybeSingle(),
                    8000,
                    'CREATED_ORG_QUERY'
                );

                const createdOrg = createdOrgResponse.data;
                const createdOrgError = createdOrgResponse.error;
                if (createdOrgError && createdOrgError.code !== 'PGRST116') {
                    throw createdOrgError;
                }

                return createdOrg ?? null;
            } catch (err: unknown) {
                console.error('[useOrg] Critical org query error:', err instanceof Error ? err.message : err);
                return null;
            }
        },
        enabled: !isSuperAdmin && !!user?.id && !authLoading,
        retry: 0,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        meta: {
            errorMessage: 'Falha ao carregar organizacao',
        },
    });

    const currentOrganization = isSuperAdmin
        ? (selectedOrgId
            ? allOrganizations?.find(o => o.id === selectedOrgId)
            : allOrganizations?.[0])
        : userOrganization;

    useEffect(() => {
        if (isSuperAdmin && allOrganizations && allOrganizations.length > 0 && !selectedOrgId) {
            setSelectedOrgId(allOrganizations[0].id);
        }
    }, [isSuperAdmin, allOrganizations, selectedOrgId]);

    const isLoading = authLoading || (isSuperAdmin ? allOrgsLoading : (!!user && userOrgLoading));

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
