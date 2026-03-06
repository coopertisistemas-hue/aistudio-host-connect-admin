import {
  InternalReviewAdapter,
  type ReviewAdapter,
} from "./internalReviewAdapter";
import type {
  ReputationAnalyticsCommand,
  ReputationAnalyticsResult,
  ReputationAnalyticsSnapshot,
  ReviewMonitoringRecord,
  ReviewSentiment,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isReputationAnalyticsEnabled = (command: ReputationAnalyticsCommand): boolean => {
  const flag = command.featureFlags?.reputationAnalytics;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined &&
    (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

const normalizeToFiveStar = (record: ReviewMonitoringRecord): number => {
  if (record.maxRating <= 0) return 0;
  return Number(((record.rating / record.maxRating) * 5).toFixed(2));
};

const toSentimentPlaceholder = (normalizedRating: number): ReviewSentiment => {
  if (normalizedRating >= 4) return "positive";
  if (normalizedRating <= 2) return "negative";
  return "neutral";
};

export interface ReputationAnalyticsLayerDependencies {
  adapter?: ReviewAdapter;
}

export class ReputationAnalyticsLayer {
  private readonly adapter: ReviewAdapter;

  constructor({ adapter }: ReputationAnalyticsLayerDependencies = {}) {
    this.adapter = adapter ?? new InternalReviewAdapter();
  }

  async analyze(command: ReputationAnalyticsCommand): Promise<ReputationAnalyticsResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isReputationAnalyticsEnabled(command)) {
      return {
        accepted: false,
        correlationId,
        reason: "feature_disabled",
      };
    }

    const reviews = await this.adapter.list({
      tenant: command.tenant,
      fromDate: command.range?.fromDate,
      toDate: command.range?.toDate,
    });

    const snapshot = this.buildSnapshot(reviews);

    return {
      accepted: true,
      correlationId,
      snapshot,
    };
  }

  private buildSnapshot(reviews: ReviewMonitoringRecord[]): ReputationAnalyticsSnapshot {
    const normalizedRatings = reviews.map((review) => normalizeToFiveStar(review));
    const totalReviews = reviews.length;

    const ratingAggregation: ReputationAnalyticsSnapshot["ratingAggregation"] = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const sentimentPlaceholder: ReputationAnalyticsSnapshot["sentimentPlaceholder"] = {
      positive: 0,
      neutral: 0,
      negative: 0,
      unknown: 0,
    };

    normalizedRatings.forEach((rating) => {
      const bucket = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
      ratingAggregation[bucket] += 1;
      sentimentPlaceholder[toSentimentPlaceholder(rating)] += 1;
    });

    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              normalizedRatings.reduce((sum, rating) => sum + rating, 0) / totalReviews
            ).toFixed(2),
          );

    const trendDirection = this.detectTrendDirection(reviews);
    const reputationScore = this.calculateReputationScore({
      totalReviews,
      averageRating,
      sentimentPlaceholder,
    });

    return {
      totalReviews,
      averageRating,
      ratingAggregation,
      trendDirection,
      sentimentPlaceholder,
      reputationScore,
      generatedAt: new Date().toISOString(),
    };
  }

  private detectTrendDirection(
    reviews: ReviewMonitoringRecord[],
  ): ReputationAnalyticsSnapshot["trendDirection"] {
    if (reviews.length < 4) return "stable";

    const ordered = [...reviews].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    const splitIndex = Math.floor(ordered.length / 2);
    const older = ordered.slice(0, splitIndex).map(normalizeToFiveStar);
    const newer = ordered.slice(splitIndex).map(normalizeToFiveStar);

    const olderAverage = older.reduce((sum, rating) => sum + rating, 0) / older.length;
    const newerAverage = newer.reduce((sum, rating) => sum + rating, 0) / newer.length;
    const delta = newerAverage - olderAverage;

    if (delta >= 0.3) return "improving";
    if (delta <= -0.3) return "declining";
    return "stable";
  }

  private calculateReputationScore(input: {
    totalReviews: number;
    averageRating: number;
    sentimentPlaceholder: ReputationAnalyticsSnapshot["sentimentPlaceholder"];
  }): number {
    const ratingWeight = (input.averageRating / 5) * 70;
    const positiveRatio =
      input.totalReviews === 0
        ? 0
        : input.sentimentPlaceholder.positive / input.totalReviews;
    const sentimentWeight = positiveRatio * 20;
    const volumeWeight = Math.min(10, input.totalReviews / 10);

    return Number((ratingWeight + sentimentWeight + volumeWeight).toFixed(2));
  }
}
