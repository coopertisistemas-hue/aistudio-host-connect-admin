import { createContext, useContext, type ReactNode } from "react";
import { useAccessContext } from "@/platform/access";
import { TenantAdapter } from "./TenantAdapter";
import type { TenantContextValue } from "./TenantTypes";

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantContextProvider = ({ children }: { children: ReactNode }) => {
  const { accessContext, isLoading } = useAccessContext();
  const tenantScope = TenantAdapter.fromAccessContext(accessContext);

  return (
    <TenantContext.Provider
      value={{
        ...tenantScope,
        isLoading,
        hasTenantScope: !!tenantScope.currentOrgId,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantContextProvider");
  }

  return context;
};
