export type SubscriptionStatus = "trial" | "active" | "grace" | "suspended" | "cancelled";

export type SubscriptionEvent =
  | "trial_started"
  | "trial_expired"
  | "payment_succeeded"
  | "payment_failed"
  | "grace_expired"
  | "manual_suspend"
  | "manual_resume"
  | "cancel_requested"
  | "reactivated";

export type SubscriptionSnapshot = {
  sourceStatus: SubscriptionStatus;
  effectiveStatus: SubscriptionStatus;
  trialExpired: boolean;
  overdueInvoices: number;
  outstandingValue: number;
};

const STATUS_ALIASES: Record<string, SubscriptionStatus> = {
  trial: "trial",
  active: "active",
  grace: "grace",
  grace_period: "grace",
  past_due: "grace",
  suspended: "suspended",
  blocked: "suspended",
  cancelled: "cancelled",
  canceled: "cancelled",
  inactive: "cancelled",
};

const TRANSITION_MATRIX: Record<SubscriptionStatus, Partial<Record<SubscriptionEvent, SubscriptionStatus>>> = {
  trial: {
    trial_expired: "grace",
    payment_succeeded: "active",
    cancel_requested: "cancelled",
  },
  active: {
    payment_failed: "grace",
    manual_suspend: "suspended",
    cancel_requested: "cancelled",
  },
  grace: {
    payment_succeeded: "active",
    grace_expired: "suspended",
    cancel_requested: "cancelled",
  },
  suspended: {
    payment_succeeded: "active",
    manual_resume: "active",
    cancel_requested: "cancelled",
  },
  cancelled: {
    reactivated: "active",
  },
};

export function normalizeSubscriptionStatus(rawStatus: string | null | undefined): SubscriptionStatus {
  if (!rawStatus) return "active";
  return STATUS_ALIASES[rawStatus.toLowerCase()] ?? "active";
}

export function deriveSubscriptionSnapshot(params: {
  rawStatus: string | null | undefined;
  trialExpiresAt: string | null | undefined;
  overdueInvoices: number;
  outstandingValue: number;
}): SubscriptionSnapshot {
  const { rawStatus, trialExpiresAt, overdueInvoices, outstandingValue } = params;

  const sourceStatus = normalizeSubscriptionStatus(rawStatus);
  const now = new Date();
  const trialExpired = !!trialExpiresAt && new Date(trialExpiresAt).getTime() < now.getTime();

  let effectiveStatus = sourceStatus;

  if (sourceStatus === "trial" && trialExpired) {
    effectiveStatus = overdueInvoices > 0 || outstandingValue > 0 ? "grace" : "active";
  } else if (sourceStatus === "active" && (overdueInvoices > 0 || outstandingValue > 0)) {
    effectiveStatus = "grace";
  } else if (sourceStatus === "grace" && overdueInvoices >= 3) {
    effectiveStatus = "suspended";
  }

  return {
    sourceStatus,
    effectiveStatus,
    trialExpired,
    overdueInvoices,
    outstandingValue,
  };
}

export function getAllowedSubscriptionTransitions(
  status: SubscriptionStatus,
): Array<{ event: SubscriptionEvent; nextStatus: SubscriptionStatus }> {
  const row = TRANSITION_MATRIX[status];
  return Object.entries(row).map(([event, nextStatus]) => ({
    event: event as SubscriptionEvent,
    nextStatus: nextStatus as SubscriptionStatus,
  }));
}

export function canTransitionSubscriptionStatus(params: {
  from: SubscriptionStatus;
  event: SubscriptionEvent;
  to: SubscriptionStatus;
}): boolean {
  const { from, event, to } = params;
  return TRANSITION_MATRIX[from][event] === to;
}

