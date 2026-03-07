export interface RolloutReadinessFeatureFlags {
  rolloutReadinessChecklist?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface RolloutGate {
  gate: "build" | "typecheck" | "lint" | "health_monitoring" | "audit_completeness";
  status: "PASS" | "FAIL";
  evidencePath: string;
  notes?: string;
}

export interface RolloutReadinessAssessment {
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  generatedAt: string;
  gates: RolloutGate[];
  finalStatus: "PASS" | "FAIL";
}

export const evaluateRolloutReadiness = (
  gates: RolloutGate[],
): RolloutReadinessAssessment["finalStatus"] =>
  gates.every((gate) => gate.status === "PASS") ? "PASS" : "FAIL";
