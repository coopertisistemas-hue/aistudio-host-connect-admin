# SP67 - Dynamic Price Suggestion Baseline

## Objective
Create dynamic price suggestion baseline combining tariff calendar, pricing rules and competitor monitoring signals.

## Scope
- Added dynamic suggestion contracts and feature flag guard (`dynamicPriceSuggestion`).
- Added dynamic suggestion adapter with weighted explainable baseline logic.
- Added queue/event compatible dynamic suggestion layer consuming SP64/SP65/SP66 layers.
- Updated module index exports.

## Safety
- Advisory-only outputs.
- No automatic pricing mutation.
- No DB changes.
- No PMS runtime behavior changes.

## Sprint Verdict
PASS
