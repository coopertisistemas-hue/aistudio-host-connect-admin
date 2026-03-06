export type EntitlementDecision = "allowed" | "upgrade_required" | "permission_denied";

export type EntitlementAuditEntry = {
  moduleKey: string;
  decision: EntitlementDecision;
  plan: string;
  role: string | null;
  source: "plan" | "permission" | "role";
  occurredAt: string;
};

const AUDIT_KEY = "entitlement_audit_buffer_v1";
const MAX_AUDIT_ENTRIES = 120;

export function appendEntitlementAudit(entry: EntitlementAuditEntry): void {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const current: EntitlementAuditEntry[] = raw ? (JSON.parse(raw) as EntitlementAuditEntry[]) : [];
    const next = [entry, ...current].slice(0, MAX_AUDIT_ENTRIES);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  } catch {
    // Non-blocking: entitlement checks must not fail due to client storage issues.
  }
}

export function evaluateEntitlementAccess(params: {
  moduleKey: string;
  planAllows: boolean;
  role: string | null;
  explicitPermission: boolean | undefined;
  plan: string;
}): EntitlementDecision {
  const { moduleKey, planAllows, role, explicitPermission, plan } = params;

  if (!planAllows) {
    appendEntitlementAudit({
      moduleKey,
      decision: "upgrade_required",
      plan,
      role,
      source: "plan",
      occurredAt: new Date().toISOString(),
    });
    return "upgrade_required";
  }

  if (role === "owner" || role === "admin") {
    appendEntitlementAudit({
      moduleKey,
      decision: "allowed",
      plan,
      role,
      source: "role",
      occurredAt: new Date().toISOString(),
    });
    return "allowed";
  }

  if (explicitPermission === false) {
    appendEntitlementAudit({
      moduleKey,
      decision: "permission_denied",
      plan,
      role,
      source: "permission",
      occurredAt: new Date().toISOString(),
    });
    return "permission_denied";
  }

  appendEntitlementAudit({
    moduleKey,
    decision: "allowed",
    plan,
    role,
    source: "permission",
    occurredAt: new Date().toISOString(),
  });
  return "allowed";
}

