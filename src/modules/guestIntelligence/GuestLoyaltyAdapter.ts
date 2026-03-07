import type { GuestProfileRecord } from "./GuestProfileTypes";
import type { GuestSegmentSignal } from "./GuestSegmentationTypes";
import type { GuestLoyaltySignal } from "./GuestLoyaltyTypes";

export interface GuestLoyaltyAdapter {
  deriveSignal(
    profile: GuestProfileRecord,
    segment: GuestSegmentSignal | undefined,
    correlationId: string,
  ): Promise<GuestLoyaltySignal>;
}

const calculateStayFrequencyPerYear = (totalStays: number, lastStayAt?: string): number => {
  if (!lastStayAt || totalStays <= 0) return totalStays;
  const diffDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(lastStayAt).getTime()) / (1000 * 60 * 60 * 24)),
  );
  const years = Math.max(1 / 12, diffDays / 365);
  return Number((totalStays / years).toFixed(2));
};

export class InMemoryGuestLoyaltyAdapter implements GuestLoyaltyAdapter {
  async deriveSignal(
    profile: GuestProfileRecord,
    segment: GuestSegmentSignal | undefined,
    correlationId: string,
  ): Promise<GuestLoyaltySignal> {
    const repeatGuest = profile.stayAggregation.totalStays >= 2;
    const stayFrequencyPerYear = calculateStayFrequencyPerYear(
      profile.stayAggregation.totalStays,
      profile.stayAggregation.lastStayAt,
    );

    const ltvPlaceholder = Number(
      (
        profile.stayAggregation.totalRevenue
        + profile.stayAggregation.totalStays * 150
      ).toFixed(2),
    );

    const nextBestActionHints: string[] = [];
    if (segment?.valueBucket === "low") nextBestActionHints.push("nurture_low_value_guest");
    if (segment?.valueBucket === "vip_placeholder") nextBestActionHints.push("vip_retention_watch");
    if (segment?.recency === "inactive") nextBestActionHints.push("reactivation_campaign_placeholder");
    if (repeatGuest) nextBestActionHints.push("loyal_guest_recognition_placeholder");

    const lifecycleTags: string[] = [
      repeatGuest ? "repeat_guest" : "first_time_guest",
      `frequency:${stayFrequencyPerYear}`,
      `ltv:${ltvPlaceholder}`,
    ];

    return {
      canonicalGuestId: profile.canonicalGuestId,
      orgId: profile.orgId,
      propertyId: profile.primaryPropertyId,
      repeatGuest,
      stayFrequencyPerYear,
      ltvPlaceholder,
      preferences: {
        preferredLanguage: profile.profile.language,
        preferredPropertyId: profile.primaryPropertyId,
        tags: profile.profile.tags,
      },
      recommendationCompatibility: {
        nextBestActionHints,
      },
      lifecycleCompatibility: {
        lifecycleTags,
      },
      correlationId,
      updatedAt: new Date().toISOString(),
    };
  }
}
