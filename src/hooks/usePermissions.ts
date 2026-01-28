import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrg } from '@/hooks/useOrg';

export type ModuleKey = 
  | 'financial'
  | 'bookings'
  | 'guests'
  | 'properties'
  | 'inventory'
  | 'team'
  | 'reports'
  | 'settings';

export type PermissionAction = 'read' | 'write';

interface MemberPermission {
  id: string;
  org_id: string;
  user_id: string;
  module_key: ModuleKey;
  can_read: boolean;
  can_write: boolean;
}

interface UsePermissionsReturn {
  canAccess: (module: ModuleKey, action?: PermissionAction) => boolean;
  permissions: MemberPermission[];
  isLoading: boolean;
  isOwnerOrAdmin: boolean;
  role: string | null;
}

/**
 * Hook to check user permissions for specific modules
 * 
 * @returns {UsePermissionsReturn} Permission checking functions and state
 * 
 * @example
 * const { canAccess, isOwnerOrAdmin } = usePermissions();
 * 
 * if (!canAccess('financial', 'write')) {
 *   return <AccessDenied />;
 * }
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const { currentOrgId, role } = useOrg();

  // Fetch user's permissions from member_permissions table
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['member-permissions', user?.id, currentOrgId],
    queryFn: async () => {
      if (!user?.id || !currentOrgId) {
        return [];
      }

      const { data, error } = await supabase
        .from('member_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', currentOrgId);

      if (error) {
        console.error('[usePermissions] Error fetching permissions:', error);
        return [];
      }

      return data as MemberPermission[];
    },
    enabled: !!user?.id && !!currentOrgId,
  });

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  /**
   * Check if user can access a specific module with a specific action
   * 
   * @param module - Module key to check
   * @param action - Action to check ('read' or 'write'), defaults to 'read'
   * @returns {boolean} True if user has permission
   */
  const canAccess = (module: ModuleKey, action: PermissionAction = 'read'): boolean => {
    // Owner and Admin have full access to everything
    if (isOwnerOrAdmin) {
      return true;
    }

    // Viewer role: read-only access to all modules
    if (role === 'viewer') {
      return action === 'read';
    }

    // For members, check specific permissions
    const permission = permissions.find(p => p.module_key === module);

    if (!permission) {
      // No explicit permission found - deny access
      return false;
    }

    if (action === 'read') {
      return permission.can_read;
    }

    if (action === 'write') {
      return permission.can_write;
    }

    return false;
  };

  return {
    canAccess,
    permissions,
    isLoading,
    isOwnerOrAdmin,
    role,
  };
};
