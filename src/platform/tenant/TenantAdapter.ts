import type { AccessContext as AccessContextModel } from "@/platform/access";
import type { TenantScope } from "./TenantTypes";

export const TenantAdapter = {
  fromAccessContext(accessContext: AccessContextModel | null): TenantScope {
    return {
      currentOrgId: accessContext?.orgId ?? null,
      currentPropertyId: accessContext?.propertyId ?? null,
    };
  },
};
