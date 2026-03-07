import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { usePermissions } from "@/hooks/usePermissions";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { supabase } from "@/integrations/supabase/client";
import { AccessPolicyAdapter } from "./AccessPolicyAdapter";
import type { AccessContext as AccessContextModel, AccessPermission } from "./AccessPolicyTypes";

interface AccessContextValue {
  accessContext: AccessContextModel | null;
  isLoading: boolean;
}

const AccessContext = createContext<AccessContextValue | undefined>(undefined);

const normalizePermissions = (
  permissions: Array<{ module_key: string; can_read: boolean; can_write: boolean }>,
): AccessPermission[] =>
  permissions.map((permission) => ({
    moduleKey: permission.module_key,
    canRead: permission.can_read,
    canWrite: permission.can_write,
  }));

export const AccessContextProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, userRole, userPlan, isSuperAdmin } = useAuth();
  const { currentOrgId, isLoading: orgLoading } = useOrg();
  const { selectedPropertyId, isLoading: propertyLoading } = useSelectedProperty();
  const { permissions, isLoading: permissionsLoading } = usePermissions();

  const { data: isConnectStaff = false, isLoading: staffLoading } = useQuery({
    queryKey: ["is_hostconnect_staff", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_hostconnect_staff");
      if (error) {
        console.error("[AccessContextProvider] Failed to resolve connect staff status:", error);
        return false;
      }
      return !!data;
    },
  });

  const normalizedPermissions = normalizePermissions(permissions);

  const accessContext = user
    ? AccessPolicyAdapter.buildAccessContext({
        userId: user.id,
        orgId: currentOrgId,
        propertyId: selectedPropertyId,
        authRole: userRole,
        isSuperAdmin,
        isConnectStaff,
        plan: userPlan,
        permissions: normalizedPermissions,
        entitlements: {
          plan: userPlan,
        },
      })
    : null;

  return (
    <AccessContext.Provider
      value={{
        accessContext,
        isLoading: authLoading || orgLoading || propertyLoading || permissionsLoading || staffLoading,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
};

export const useAccessContext = (): AccessContextValue => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error("useAccessContext must be used within an AccessContextProvider");
  }
  return context;
};
