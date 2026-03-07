# SP65 - Pricing Rules Engine Baseline

## Objective
Create deterministic pricing rules engine baseline with strict precedence and explainability metadata.

## Scope
- Added pricing rules contracts and feature flag guard (`pricingRulesEngine`).
- Added deterministic rule engine (priority-ordered).
- Added queue/event compatible pricing rules layer.
- Updated module index exports.

## Safety
- Advisory-only outputs.
- No automatic pricing mutation.
- No DB changes.
- No PMS runtime behavior changes.

## Sprint Verdict
PASS
