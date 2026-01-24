import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type Organization = Tables<'organizations'>;

interface OrgContextType {
    organization: Organization | null;
    currentOrgId: string | null;
    isLoading: boolean;
    error: any;
    hasOrg: boolean;
    isSuperAdmin: boolean;
    allOrganizations: Organization[];
    selectedOrgId: string | null;
    setSelectedOrgId: (id: string | null) => void;
    role: string | null;
    refetch: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = ({ children }: { children: ReactNode }) => {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    // ============================================================================
    // LOAD SAVED ORG (Super Admin Only)
    // ============================================================================
    useEffect(() => {
        if (isSuperAdmin && !hasInitialized) {
            const savedOrgId = localStorage.getItem('hc_selected_org_id');
            if (savedOrgId) {
                console.log('[OrgProvider] 💾 Loading saved OrgId from localStorage:', savedOrgId);
                setSelectedOrgIdState(savedOrgId);
            }
            setHasInitialized(true);
        }
    }, [isSuperAdmin, hasInitialized]);

    // ============================================================================
    // SUPER ADMIN: Fetch ALL organizations
    // ============================================================================
    const { data: allOrganizations, isLoading: allOrgsLoading } = useQuery<Organization[]>({
        queryKey: ['all-organizations'],
        queryFn: async () => {
            console.log('[OrgProvider] 🔑 Super admin mode: Fetching ALL organizations');

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('name');

            if (error) {
                console.error('[OrgProvider] ❌ Error fetching all organizations:', error);
                throw error;
            }

            console.log(`[OrgProvider] ✅ Fetched ${data?.length || 0} organizations for super admin`);
            return data || [];
        },
        enabled: isSuperAdmin && !!user?.id && !authLoading,
        staleTime: 5 * 60 * 1000,
    });

    // ============================================================================
    // REGULAR USER: Fetch user's organization
    // ============================================================================
    const { data: userOrganization, isLoading: userOrgLoading, error, refetch } = useQuery<Organization | null>({
        queryKey: ['organization', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            console.log('[OrgProvider] 🔍 Querying org for user:', user.id);

            const { data, error: fetchError } = await supabase
                .from('organizations')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (data) return data;

            // Auto-create default org if missing
            const defaultName = user.user_metadata?.full_name
                ? `${user.user_metadata.full_name}'s Organization`
                : user.email?.split('@')[0]
                    ? `${user.email.split('@')[0]}'s Organization`
                    : 'Minha Organização';

            const { data: newOrg, error: createError } = await supabase
                .from('organizations')
                .insert({ owner_id: user.id, name: defaultName })
                .select()
                .single();

            if (createError) {
                if (createError.code === '23505') {
                    const { data: retryData } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('owner_id', user.id)
                        .single();
                    return retryData;
                }
                throw createError;
            }
            return newOrg;
        },
        enabled: !isSuperAdmin && !!user?.id && !authLoading,
        staleTime: 5 * 60 * 1000,
    });

    // ============================================================================
    // PERSISTENCE & ACTIONS
    // ============================================================================
    const setSelectedOrgId = (id: string | null) => {
        setSelectedOrgIdState(id);
        if (id) {
            localStorage.setItem('hc_selected_org_id', id);
        } else {
            localStorage.removeItem('hc_selected_org_id');
        }
    };

    // ============================================================================
    // DETERMINE CURRENT ORGANIZATION
    // ============================================================================
    const currentOrganization = isSuperAdmin
        ? (selectedOrgId
            ? allOrganizations?.find(o => o.id === selectedOrgId)
            : allOrganizations?.[0])
        : userOrganization;

    // Auto-select first org for super admin if none selected and no localStorage
    useEffect(() => {
        if (isSuperAdmin && allOrganizations && allOrganizations.length > 0 && !selectedOrgId && hasInitialized) {
            console.log('[OrgProvider] 🎯 Auto-selecting first available org');
            setSelectedOrgId(allOrganizations[0].id);
        }
    }, [isSuperAdmin, allOrganizations, selectedOrgId, hasInitialized]);

    // ============================================================================
    // FETCH ROLE IN ORGANIZATION
    // ============================================================================
    const { data: orgMemberData, isLoading: orgMemberLoading } = useQuery({
        queryKey: ['org-member-role', user?.id, currentOrganization?.id],
        queryFn: async () => {
            if (!user?.id || !currentOrganization?.id) return null;

            console.log(`[OrgProvider] 🎭 Fetching role for user ${user.id} in org ${currentOrganization.id}`);

            const { data, error } = await supabase
                .from('org_members')
                .select('role')
                .eq('org_id', currentOrganization.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('[OrgProvider] ❌ Error fetching org member role:', error);
                throw error;
            }

            return data;
        },
        enabled: !isSuperAdmin && !!user?.id && !!currentOrganization?.id && !authLoading,
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = authLoading || (isSuperAdmin ? allOrgsLoading : (!!user && userOrgLoading)) || (!isSuperAdmin && orgMemberLoading);

    // Super admins skip org_members role lookup
    const effectiveRole = isSuperAdmin ? 'super_admin' : (orgMemberData?.role || null);

    const value = {
        organization: currentOrganization || null,
        currentOrgId: currentOrganization?.id || null,
        role: effectiveRole,
        isLoading,
        error,
        hasOrg: !!currentOrganization,
        isSuperAdmin,
        allOrganizations: allOrganizations || [],
        selectedOrgId,
        setSelectedOrgId,
        refetch,
    };

    return (
        <OrgContext.Provider value={value} >
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error('useOrg must be used within an OrgProvider');
    }
    return context;
};
