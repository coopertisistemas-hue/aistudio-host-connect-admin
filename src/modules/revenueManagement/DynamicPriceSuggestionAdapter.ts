import type { DynamicPriceSuggestionRecord } from "./DynamicPriceSuggestionTypes";

export interface DynamicPriceSuggestionInput {
  targetDate: string;
  baseRate: number;
  rulesSuggestedRate: number;
  competitorAverageRate?: number;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
}

export class DynamicPriceSuggestionAdapter {
  derive(input: DynamicPriceSuggestionInput): Omit<DynamicPriceSuggestionRecord, "suggestionId" | "updatedAt"> {
    const hasCompetitorRate = input.competitorAverageRate !== undefined;

    const weights = hasCompetitorRate
      ? { rulesWeight: 0.6, competitorWeight: 0.25, baseWeight: 0.15 }
      : { rulesWeight: 0.75, competitorWeight: 0, baseWeight: 0.25 };

    const competitorValue = input.competitorAverageRate ?? 0;
    const suggestedRate =
      input.rulesSuggestedRate * weights.rulesWeight
      + competitorValue * weights.competitorWeight
      + input.baseRate * weights.baseWeight;

    const notes = hasCompetitorRate
      ? ["competitor_rate_included", "advisory_only"]
      : ["competitor_rate_unavailable", "advisory_only"];

    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      targetDate: input.targetDate,
      baseRate: input.baseRate,
      rulesSuggestedRate: input.rulesSuggestedRate,
      competitorAverageRate: input.competitorAverageRate,
      suggestedRate: Number(suggestedRate.toFixed(2)),
      explainability: {
        method: "weighted_baseline",
        inputs: {
          baseRate: input.baseRate,
          rulesSuggestedRate: input.rulesSuggestedRate,
          competitorAverageRate: input.competitorAverageRate,
        },
        weights,
        notes,
      },
      advisoryOnly: true,
      correlationId: input.correlationId,
    };
  }
}
