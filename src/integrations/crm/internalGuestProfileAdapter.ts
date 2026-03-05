import type {
  GuestProfilePayload,
  GuestProfileRecord,
  GuestTenantContext,
} from "./guestProfileTypes";

export interface GuestProfileAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: GuestTenantContext;
  payload: GuestProfilePayload;
}

export interface GuestProfileAdapterResult {
  guestId: string;
  updatedAt: string;
}

export interface GuestProfileAdapter {
  upsertProfile(input: GuestProfileAdapterInput): Promise<GuestProfileAdapterResult>;
}

const profileKey = (orgId: string, propertyId: string | null | undefined, guestId: string) =>
  `${orgId}:${propertyId ?? "_all"}:${guestId}`;

export class InternalGuestProfileAdapter implements GuestProfileAdapter {
  private readonly profiles = new Map<string, GuestProfileRecord>();

  async upsertProfile(input: GuestProfileAdapterInput): Promise<GuestProfileAdapterResult> {
    const updatedAt = new Date().toISOString();
    const key = profileKey(input.tenant.orgId, input.tenant.propertyId, input.payload.guestId);
    const existing = this.profiles.get(key);

    this.profiles.set(key, {
      guestId: input.payload.guestId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      fullName: input.payload.fullName,
      contact: input.payload.contact,
      language: input.payload.language,
      tags: input.payload.tags ?? existing?.tags ?? [],
      notes: input.payload.notes,
      updatedAt,
      correlationId: input.correlationId,
    });

    return {
      guestId: input.payload.guestId,
      updatedAt,
    };
  }

  listProfiles(): GuestProfileRecord[] {
    return Array.from(this.profiles.values());
  }
}
