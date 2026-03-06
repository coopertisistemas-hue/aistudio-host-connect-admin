import type {
  FnrhPreparedSubmissionRecord,
  FnrhSubmissionPayload,
  FnrhSubmissionQuery,
  FnrhTenantContext,
  FnrhValidationIssue,
} from "./types";

export interface FnrhAdapterPrepareInput {
  messageId: string;
  correlationId: string;
  tenant: FnrhTenantContext;
  payload: FnrhSubmissionPayload;
}

export interface FnrhAdapterPrepareResult {
  submissionId: string;
  preparedAt: string;
  status: "prepared" | "invalid";
  issues: FnrhValidationIssue[];
}

export interface FnrhAdapter {
  prepare(input: FnrhAdapterPrepareInput): Promise<FnrhAdapterPrepareResult>;
  listPreparedSubmissions(query: FnrhSubmissionQuery): Promise<FnrhPreparedSubmissionRecord[]>;
}

const createTenantKey = (tenant: FnrhTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createSubmissionId = (messageId: string): string =>
  `fnrh-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

const normalizeWhitespace = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.trim().replace(/\s+/g, " ");
};

const normalizeDocumentNumber = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const normalizePhone = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.startsWith("55")) {
    return `+${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return `+55${digits}`;
  }

  return `+${digits}`;
};

const normalizeState = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.trim().toUpperCase();
};

const normalizeDate = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

const hashPayload = (payload: Record<string, unknown>): string => {
  const json = JSON.stringify(payload);
  let hash = 0;

  for (let i = 0; i < json.length; i += 1) {
    hash = (hash << 5) - hash + json.charCodeAt(i);
    hash |= 0;
  }

  return `h${Math.abs(hash)}`;
};

const buildValidationIssues = (
  input: FnrhAdapterPrepareInput,
  normalized: {
    fullName?: string;
    documentType: string;
    documentNumber: string;
    checkInDate?: string;
    checkOutDate?: string;
    birthDate?: string;
    email?: string;
    phone?: string;
  },
): FnrhValidationIssue[] => {
  const issues: FnrhValidationIssue[] = [];

  if (!input.tenant.orgId) {
    issues.push({
      field: "tenant.orgId",
      code: "REQUIRED_MISSING",
      message: "Organization context is required.",
      severity: "BLOCK",
    });
  }

  if (!input.tenant.propertyId) {
    issues.push({
      field: "tenant.propertyId",
      code: "REQUIRED_MISSING",
      message: "Property context is required for FNRH routing.",
      severity: "BLOCK",
    });
  }

  if (!input.payload.reservation.reservationId.trim()) {
    issues.push({
      field: "reservation.reservationId",
      code: "REQUIRED_MISSING",
      message: "Reservation id is required.",
      severity: "BLOCK",
    });
  }

  if (!normalized.checkInDate) {
    issues.push({
      field: "reservation.checkInDate",
      code: "INVALID_DATE",
      message: "Check-in date is invalid or missing.",
      severity: "BLOCK",
    });
  }

  if (!normalized.checkOutDate) {
    issues.push({
      field: "reservation.checkOutDate",
      code: "INVALID_DATE",
      message: "Check-out date is invalid or missing.",
      severity: "BLOCK",
    });
  }

  if (normalized.checkInDate && normalized.checkOutDate) {
    if (new Date(normalized.checkOutDate).getTime() < new Date(normalized.checkInDate).getTime()) {
      issues.push({
        field: "reservation.checkOutDate",
        code: "DATE_RANGE_INVALID",
        message: "Check-out date must be greater than or equal to check-in date.",
        severity: "BLOCK",
      });
    }
  }

  if (!normalized.fullName || normalized.fullName.length < 3) {
    issues.push({
      field: "guest.fullName",
      code: "REQUIRED_MISSING",
      message: "Guest full name is required.",
      severity: "BLOCK",
    });
  }

  if (!normalized.documentNumber) {
    issues.push({
      field: "guest.document.number",
      code: "REQUIRED_MISSING",
      message: "Guest document number is required.",
      severity: "BLOCK",
    });
  }

  if (!normalized.documentType) {
    issues.push({
      field: "guest.document.type",
      code: "REQUIRED_MISSING",
      message: "Guest document type is required.",
      severity: "BLOCK",
    });
  }

  if (normalized.documentType === "CPF" && normalized.documentNumber.length !== 11) {
    issues.push({
      field: "guest.document.number",
      code: "CPF_INVALID_LENGTH",
      message: "CPF must contain 11 digits.",
      severity: "BLOCK",
    });
  }

  if (!input.payload.property.establishmentCode?.trim()) {
    issues.push({
      field: "property.establishmentCode",
      code: "PROFILE_MISSING",
      message: "Property establishment code is required for submission routing.",
      severity: "BLOCK",
    });
  }

  if (!normalized.birthDate) {
    issues.push({
      field: "guest.birthDate",
      code: "MISSING_OPTIONAL",
      message: "Birthdate missing and may be required depending on guest profile.",
      severity: "WARN",
    });
  }

  if (!normalized.email && !normalized.phone) {
    issues.push({
      field: "guest.contact",
      code: "CONTACT_MISSING",
      message: "No email or phone provided.",
      severity: "WARN",
    });
  }

  return issues;
};

export class InternalFnrhAdapter implements FnrhAdapter {
  private readonly recordsByTenant = new Map<string, FnrhPreparedSubmissionRecord[]>();

  async prepare(input: FnrhAdapterPrepareInput): Promise<FnrhAdapterPrepareResult> {
    const submissionId = createSubmissionId(input.messageId);
    const tenantKey = createTenantKey(input.tenant);
    const preparedAt = new Date().toISOString();

    const normalized = {
      fullName: normalizeWhitespace(input.payload.guest.fullName),
      documentType: input.payload.guest.document.type ?? "OUTRO",
      documentNumber: normalizeDocumentNumber(input.payload.guest.document.number),
      checkInDate: normalizeDate(input.payload.reservation.checkInDate),
      checkOutDate: normalizeDate(input.payload.reservation.checkOutDate),
      birthDate: normalizeDate(input.payload.guest.birthDate),
      email: normalizeWhitespace(input.payload.guest.email)?.toLowerCase(),
      phone: normalizePhone(input.payload.guest.phone),
      propertyState: normalizeState(input.payload.property.state),
    };

    const issues = buildValidationIssues(input, normalized);
    const hasBlockingIssue = issues.some((issue) => issue.severity === "BLOCK");

    const dadosFicha: Record<string, unknown> = {
      etapa: input.payload.lifecycleStage,
      estabelecimento: {
        codigo: normalizeWhitespace(input.payload.property.establishmentCode),
        nome: normalizeWhitespace(input.payload.property.name),
        endereco: normalizeWhitespace(input.payload.property.address),
        cidade: normalizeWhitespace(input.payload.property.city),
        uf: normalized.propertyState,
        pais: normalizeWhitespace(input.payload.property.country),
        cep: normalizeWhitespace(input.payload.property.postalCode),
      },
      reserva: {
        numero: normalizeWhitespace(input.payload.reservation.externalReservationId) ??
          normalizeWhitespace(input.payload.reservation.reservationId),
        checkin_data: normalized.checkInDate,
        checkout_data: normalized.checkOutDate,
      },
      hospede: {
        nome_completo: normalized.fullName,
        documento: {
          tipo: normalized.documentType,
          numero: normalized.documentNumber,
        },
        data_nascimento: normalized.birthDate,
        email: normalized.email,
        telefone: normalized.phone,
        nacionalidade: normalizeWhitespace(input.payload.guest.nationality),
      },
      metadata_integracao: {
        correlation_id: input.correlationId,
        solicitado_em: input.payload.requestedAt,
      },
    };

    const record: FnrhPreparedSubmissionRecord = {
      submissionId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      lifecycleStage: input.payload.lifecycleStage,
      payloadHash: hashPayload(dadosFicha),
      dadosFicha,
      issues,
      status: hasBlockingIssue ? "invalid" : "prepared",
      preparedAt,
    };

    const current = this.recordsByTenant.get(tenantKey) ?? [];
    current.push(record);
    this.recordsByTenant.set(tenantKey, current);

    if (hasBlockingIssue) {
      const message = issues
        .filter((issue) => issue.severity === "BLOCK")
        .map((issue) => `${issue.field}:${issue.code}`)
        .join(",");
      throw new Error(`validation_block:${message}`);
    }

    return {
      submissionId,
      preparedAt,
      status: record.status,
      issues,
    };
  }

  async listPreparedSubmissions(
    query: FnrhSubmissionQuery,
  ): Promise<FnrhPreparedSubmissionRecord[]> {
    const tenantKey = createTenantKey(query.tenant);
    let records = [...(this.recordsByTenant.get(tenantKey) ?? [])];

    if (query.lifecycleStage) {
      records = records.filter((record) => record.lifecycleStage === query.lifecycleStage);
    }

    if (query.status) {
      records = records.filter((record) => record.status === query.status);
    }

    records.sort((a, b) => b.preparedAt.localeCompare(a.preparedAt));

    if (query.limit !== undefined && query.limit >= 0) {
      return records.slice(0, query.limit);
    }

    return records;
  }
}
