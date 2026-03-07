import type {
  GuestIntelligenceTenantContext,
  GuestProfilePersistencePayload,
  GuestProfileQuery,
  GuestProfileRecord,
  GuestProfileSnapshot,
} from "./GuestProfileTypes";

export interface GuestProfilePersistenceAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: GuestIntelligenceTenantContext;
  payload: GuestProfilePersistencePayload;
}

export interface GuestProfilePersistenceAdapterResult {
  canonicalGuestId: string;
  updatedAt: string;
}

export interface GuestProfilePersistenceAdapter {
  persistProfile(
    input: GuestProfilePersistenceAdapterInput,
  ): Promise<GuestProfilePersistenceAdapterResult>;
  snapshot(query: GuestProfileQuery): Promise<GuestProfileSnapshot>;
}

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeEmail = (email?: string): string | undefined => {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizePhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  return digits.startsWith("+") ? digits : `+${digits}`;
};

const tenantKey = (tenant: GuestIntelligenceTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const mergeUnique = (current: string[], next?: string): string[] => {
  if (!next) return current;
  if (current.includes(next)) return current;
  return [...current, next];
};

export class InMemoryGuestProfilePersistenceAdapter
  implements GuestProfilePersistenceAdapter
{
  private readonly profilesByCanonical = new Map<string, GuestProfileRecord>();
  private readonly canonicalByIdentity = new Map<string, string>();

  async persistProfile(
    input: GuestProfilePersistenceAdapterInput,
  ): Promise<GuestProfilePersistenceAdapterResult> {
    const email = normalizeEmail(input.payload.snapshot.contact.email);
    const phone = normalizePhone(input.payload.snapshot.contact.phoneNumber);

    const identityKey = email
      ? `email:${input.tenant.orgId}:${email}`
      : phone
        ? `phone:${input.tenant.orgId}:${phone}`
        : input.payload.identity.externalGuestId
          ? `external:${input.tenant.orgId}:${input.payload.identity.externalGuestId}`
          : `fallback:${input.tenant.orgId}:${input.payload.identity.leadId ?? input.payload.identity.reservationId ?? input.payload.identity.lifecycleEventId ?? createSeed()}`;

    const dedupStrategy = email
      ? "email"
      : phone
        ? "phone"
        : input.payload.identity.externalGuestId
          ? "external_id"
          : "fallback";

    const canonicalGuestId =
      this.canonicalByIdentity.get(identityKey) ?? `guest-${createSeed()}`;

    this.canonicalByIdentity.set(identityKey, canonicalGuestId);

    const existing = this.profilesByCanonical.get(canonicalGuestId);
    const now = new Date().toISOString();

    const nextRecord: GuestProfileRecord = {
      canonicalGuestId,
      orgId: input.tenant.orgId,
      primaryPropertyId: existing?.primaryPropertyId ?? input.tenant.propertyId,
      propertiesSeen: mergeUnique(existing?.propertiesSeen ?? [], input.tenant.propertyId ?? undefined),
      identity: {
        normalizedEmail: email ?? existing?.identity.normalizedEmail,
        normalizedPhone: phone ?? existing?.identity.normalizedPhone,
        externalGuestId: input.payload.identity.externalGuestId ?? existing?.identity.externalGuestId,
        leadIds: mergeUnique(existing?.identity.leadIds ?? [], input.payload.identity.leadId),
        reservationIds: mergeUnique(
          existing?.identity.reservationIds ?? [],
          input.payload.identity.reservationId,
        ),
        lifecycleEventIds: mergeUnique(
          existing?.identity.lifecycleEventIds ?? [],
          input.payload.identity.lifecycleEventId,
        ),
        dedupStrategy,
      },
      profile: {
        fullName: input.payload.snapshot.fullName ?? existing?.profile.fullName,
        language: input.payload.snapshot.language ?? existing?.profile.language,
        tags: Array.from(new Set([...(existing?.profile.tags ?? []), ...(input.payload.snapshot.tags ?? [])])),
        notes: input.payload.snapshot.notes ?? existing?.profile.notes,
      },
      stayAggregation: {
        totalStays:
          input.payload.snapshot.stayAggregation?.totalStays ?? existing?.stayAggregation.totalStays ?? 0,
        lastStayAt:
          input.payload.snapshot.stayAggregation?.lastStayAt ?? existing?.stayAggregation.lastStayAt,
        totalRevenue:
          input.payload.snapshot.stayAggregation?.totalRevenue ?? existing?.stayAggregation.totalRevenue ?? 0,
      },
      lastSource: input.payload.source,
      lastCorrelationId: input.correlationId,
      updatedAt: now,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(input.payload.snapshot.metadata ?? {}),
      },
    };

    this.profilesByCanonical.set(canonicalGuestId, nextRecord);

    return {
      canonicalGuestId,
      updatedAt: now,
    };
  }

  async snapshot(query: GuestProfileQuery): Promise<GuestProfileSnapshot> {
    const records = Array.from(this.profilesByCanonical.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => {
        if (!query.tenant.propertyId) return true;
        return record.propertiesSeen.includes(query.tenant.propertyId);
      })
      .filter((record) => {
        if (!query.canonicalGuestId) return true;
        return record.canonicalGuestId === query.canonicalGuestId;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
