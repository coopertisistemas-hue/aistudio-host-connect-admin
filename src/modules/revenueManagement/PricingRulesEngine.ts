import type {
  PricingRuleDefinition,
  PricingRuleEvaluationRecord,
  PricingRulesCommand,
} from "./PricingRulesTypes";

const applyAction = (currentRate: number, rule: PricingRuleDefinition): number => {
  const value = rule.action.value;
  if (rule.action.type === "increase_percentage") {
    return currentRate * (1 + value / 100);
  }
  if (rule.action.type === "decrease_percentage") {
    return currentRate * (1 - value / 100);
  }
  if (rule.action.type === "set_floor_rate") {
    return Math.max(currentRate, value);
  }
  return currentRate;
};

const conditionMatches = (command: PricingRulesCommand, rule: PricingRuleDefinition): boolean => {
  const { context } = command;
  const { condition } = rule;

  if (condition.type === "occupancy_above") {
    return context.occupancySignal > Number(condition.value);
  }
  if (condition.type === "occupancy_below") {
    return context.occupancySignal < Number(condition.value);
  }
  if (condition.type === "lead_time_below_days") {
    return context.leadTimeDays < Number(condition.value);
  }
  if (condition.type === "day_of_week_in") {
    const days = Array.isArray(condition.value) ? condition.value : [];
    return days.includes(context.dayOfWeek);
  }

  return false;
};

export class PricingRulesEngine {
  evaluate(command: PricingRulesCommand, correlationId: string): Omit<PricingRuleEvaluationRecord, "evaluationId" | "updatedAt" | "orgId" | "propertyId"> {
    const enabledRules = command.rules
      .filter((rule) => rule.enabled)
      .sort((a, b) => b.priority - a.priority || a.ruleId.localeCompare(b.ruleId));

    let currentRate = command.baseRate;
    const matchedRules: PricingRuleEvaluationRecord["explainability"]["matchedRules"] = [];
    const appliedRuleIds: string[] = [];

    for (const rule of enabledRules) {
      if (!conditionMatches(command, rule)) continue;

      const previousRate = currentRate;
      currentRate = applyAction(currentRate, rule);
      appliedRuleIds.push(rule.ruleId);
      matchedRules.push({
        ruleId: rule.ruleId,
        reason: `condition:${rule.condition.type}`,
        effect: `${rule.action.type}(${rule.action.value}) rate:${previousRate.toFixed(2)}->${currentRate.toFixed(2)}`,
      });
    }

    return {
      targetDate: command.targetDate,
      baseRate: command.baseRate,
      suggestedRate: Number(currentRate.toFixed(2)),
      appliedRuleIds,
      precedenceOrder: enabledRules.map((rule) => rule.ruleId),
      explainability: {
        matchedRules,
      },
      advisoryOnly: true,
      correlationId,
    };
  }
}
