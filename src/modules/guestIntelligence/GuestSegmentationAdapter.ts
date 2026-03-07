import type { GuestProfileRecord } from "./GuestProfileTypes";
import type {
  FrequencySegment,
  GuestSegmentSignal,
  RecencySegment,
  ValueBucket,
} from "./GuestSegmentationTypes";

export interface GuestSegmentationAdapter {
  deriveSignal(profile: GuestProfileRecord, correlationId: string): Promise<GuestSegmentSignal>;
}

const daysBetween = (from: string, to: Date): number => {
  const fromDate = new Date(from);
  const ms = to.getTime() - fromDate.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const deriveRecency = (lastStayAt?: string): RecencySegment => {
  if (!lastStayAt) return "new";
  const diff = daysBetween(lastStayAt, new Date());
  if (diff <= 30) return "active";
  if (diff <= 90) return "dormant";
  return "inactive";
};

const deriveFrequency = (totalStays: number): FrequencySegment => {
  if (totalStays <= 1) return "single_stay";
  if (totalStays <= 3) return "occasional";
  if (totalStays <= 6) return "frequent";
  return "champion";
};

const deriveValueBucket = (totalRevenue: number): ValueBucket => {
  if (totalRevenue < 1000) return "low";
  if (totalRevenue < 5000) return "medium";
  if (totalRevenue < 12000) return "high";
  return "vip_placeholder";
};

export class InMemoryGuestSegmentationAdapter implements GuestSegmentationAdapter {
  async deriveSignal(profile: GuestProfileRecord, correlationId: string): Promise<GuestSegmentSignal> {
    const recency = deriveRecency(profile.stayAggregation.lastStayAt);
    const frequency = deriveFrequency(profile.stayAggregation.totalStays);
    const valueBucket = deriveValueBucket(profile.stayAggregation.totalRevenue);

    const recencyDays = profile.stayAggregation.lastStayAt
      ? daysBetween(profile.stayAggregation.lastStayAt, new Date())
      : undefined;

    const reasons: string[] = [
      `recency=${recency}`,
      `frequency=${frequency}`,
      `value=${valueBucket}`,
    ];

    const status = profile.stayAggregation.totalStays > 0 ? "ready" : "insufficient_data";

    return {
      canonicalGuestId: profile.canonicalGuestId,
      orgId: profile.orgId,
      propertyId: profile.primaryPropertyId,
      recency,
      frequency,
      valueBucket,
      segmentTags: [
        `recency:${recency}`,
        `frequency:${frequency}`,
        `value:${valueBucket}`,
      ],
      status,
      explainability: {
        recencyDays,
        totalStays: profile.stayAggregation.totalStays,
        totalRevenue: profile.stayAggregation.totalRevenue,
        reasons,
      },
      correlationId,
      updatedAt: new Date().toISOString(),
    };
  }
}
