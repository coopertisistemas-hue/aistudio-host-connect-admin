export type BillingRetryStage = "none" | "d0" | "d3" | "d7" | "d14";
export type BillingInvoiceStatus = "pending" | "paid" | "partially_paid" | "cancelled";
export type BillingRecoveryClass = "none" | "recoverable" | "terminal";

export function buildBillingIdempotencyKey(params: {
  invoiceId: string;
  status: BillingInvoiceStatus;
  retryStage: BillingRetryStage;
  dueDate: string | null;
  amount: number;
}): string {
  const { invoiceId, status, retryStage, dueDate, amount } = params;
  return `billing:${invoiceId}:${status}:${retryStage}:${dueDate ?? "no_due"}:${amount.toFixed(2)}`;
}

export function classifyBillingRecovery(params: {
  status: BillingInvoiceStatus;
  retryStage: BillingRetryStage;
}): BillingRecoveryClass {
  const { status, retryStage } = params;

  if (status === "paid" || status === "cancelled") {
    return "none";
  }

  if (retryStage === "d14") {
    return "terminal";
  }

  if (status === "pending" || status === "partially_paid") {
    return retryStage === "none" ? "none" : "recoverable";
  }

  return "none";
}

