# Schema Audit - STAGING - 2026-03-01

Source analyzed:
- `docs/db/SUPABASE_SCHEMA_STAGING_2026-03-01.sql`
- `supabase/migrations/*.sql` (for context only)
- Governance references: `docs/AUDIT_MODULES.md`, `ai/CONNECT_GUARDRAILS.md`

Method notes:
- This report is based on static inspection of the SQL dump and migration SQL files.
- If an assertion cannot be proven from those files, it is marked `UNKNOWN`.
- Index count is approximate (explicit `CREATE INDEX` statements in dump).

## Summary Metrics (public schema)

| Metric | Value |
|---|---:|
| Tables (public) | 56 |
| Policies (public) | 162 |
| Functions (public) | 27 |
| Triggers (public) | 36 |
| Indexes (public, approx) | 86 |
| RLS enabled tables | 54 |
| RLS disabled tables | 2 |

## RLS Coverage (all public tables)

| Table | RLS | Policy Count |
|---|---|---:|
| amenities | ENABLED | 4 |
| audit_log | ENABLED | 1 |
| booking_charges | ENABLED | 4 |
| booking_guests | ENABLED | 1 |
| booking_rooms | ENABLED | 4 |
| bookings | ENABLED | 8 |
| departments | ENABLED | 0 |
| entity_photos | ENABLED | 1 |
| expenses | ENABLED | 5 |
| faqs | ENABLED | 2 |
| features | ENABLED | 2 |
| guest_consents | ENABLED | 1 |
| guests | ENABLED | 2 |
| hostconnect_onboarding | ENABLED | 4 |
| hostconnect_staff | ENABLED | 0 |
| how_it_works_steps | ENABLED | 2 |
| idea_comments | ENABLED | 4 |
| ideas | ENABLED | 6 |
| integrations | ENABLED | 2 |
| inventory_items | ENABLED | 4 |
| invoices | ENABLED | 2 |
| item_stock | ENABLED | 4 |
| lead_timeline_events | ENABLED | 0 |
| member_permissions | ENABLED | 2 |
| notifications | ENABLED | 4 |
| org_invites | ENABLED | 2 |
| org_members | ENABLED | 3 |
| organizations | ENABLED | 3 |
| pre_checkin_sessions | DISABLED | 0 |
| pre_checkin_submissions | DISABLED | 0 |
| precheckin_sessions | ENABLED | 1 |
| pricing_plans | ENABLED | 2 |
| pricing_rules | ENABLED | 8 |
| profiles | ENABLED | 3 |
| properties | ENABLED | 8 |
| reservation_leads | ENABLED | 0 |
| reservation_quotes | ENABLED | 0 |
| room_categories | ENABLED | 6 |
| room_type_inventory | ENABLED | 4 |
| room_types | ENABLED | 5 |
| rooms | ENABLED | 15 |
| services | ENABLED | 8 |
| shift_assignments | ENABLED | 0 |
| shift_handoffs | ENABLED | 0 |
| shifts | ENABLED | 0 |
| staff_profiles | ENABLED | 0 |
| stock_check_items | ENABLED | 0 |
| stock_daily_checks | ENABLED | 0 |
| stock_items | ENABLED | 0 |
| stock_locations | ENABLED | 0 |
| stock_movements | ENABLED | 0 |
| tasks | ENABLED | 5 |
| testimonials | ENABLED | 2 |
| ticket_comments | ENABLED | 4 |
| tickets | ENABLED | 6 |
| website_settings | ENABLED | 8 |

## Tenant Safety Heuristic (org_id/property_id columns)

Interpretation:
- Presence/absence of `org_id` and `property_id` is a structural heuristic only.
- Some tables are expected to be global/shared and may intentionally omit tenant columns.
- Classification of each table as tenant-scoped vs global is `UNKNOWN` unless explicitly documented elsewhere.

### Tables missing `org_id`

`audit_log`, `booking_charges`, `departments`, `entity_photos`, `expenses`, `faqs`, `features`, `hostconnect_staff`, `how_it_works_steps`, `idea_comments`, `integrations`, `invoices`, `lead_timeline_events`, `notifications`, `organizations`, `pricing_plans`, `profiles`, `reservation_leads`, `reservation_quotes`, `shift_assignments`, `shift_handoffs`, `shifts`, `staff_profiles`, `stock_check_items`, `stock_daily_checks`, `stock_items`, `stock_locations`, `stock_movements`, `tasks`, `testimonials`, `ticket_comments`

### Tables missing `property_id`

`amenities`, `audit_log`, `booking_charges`, `booking_guests`, `entity_photos`, `faqs`, `features`, `guest_consents`, `guests`, `hostconnect_staff`, `how_it_works_steps`, `idea_comments`, `ideas`, `integrations`, `inventory_items`, `item_stock`, `lead_timeline_events`, `member_permissions`, `notifications`, `org_invites`, `org_members`, `organizations`, `pre_checkin_sessions`, `pre_checkin_submissions`, `precheckin_sessions`, `pricing_plans`, `profiles`, `properties`, `room_type_inventory`, `shift_assignments`, `shift_handoffs`, `stock_check_items`, `stock_daily_checks`, `stock_movements`, `testimonials`, `ticket_comments`, `tickets`

## Policy Quality Review

### RLS enabled but zero policies

`departments`, `hostconnect_staff`, `lead_timeline_events`, `reservation_leads`, `reservation_quotes`, `shift_assignments`, `shift_handoffs`, `shifts`, `staff_profiles`, `stock_check_items`, `stock_daily_checks`, `stock_items`, `stock_locations`, `stock_movements`

Risk note:
- With RLS enabled and no policies, access is denied to non-bypass roles.
- Whether this is intentional lock-down or an implementation gap is `UNKNOWN` from dump only.

### Potentially permissive/open policies (detectable via `USING (true)` / `WITH CHECK (true)`)

- `faqs`: `Allow public read access for faqs`
- `features`: `Allow public read access for features`
- `pricing_plans`: `Allow public read access for pricing plans`
- `how_it_works_steps`: `Allow public read access for steps`
- `org_invites`: `Anyone can look up token`
- `organizations`: `Users can create organizations`
- `profiles`: `profiles_read_authenticated`

Risk note:
- Some are expected for public marketing or onboarding behavior.
- Final classification (acceptable vs overexposed) requires product/security intent validation (`UNKNOWN` from schema alone).

## P0 / P1 / P2 Findings

### P0 Findings (Security)

1. `public.pre_checkin_sessions` has RLS disabled and zero policies.
2. `public.pre_checkin_submissions` has RLS disabled and zero policies.
3. `public.precheckin_sessions` (without underscore) is currently compliant in this dump:
   - `org_id` column exists.
   - RLS is enabled.
   - One SELECT policy exists.

Important naming drift:
- Both `precheckin_sessions` and `pre_checkin_sessions` exist concurrently.
- This dual-table pattern is a governance risk because it can split data paths and security posture.

### P1 Findings (Operational/Performance)

Tables with tenant columns but missing direct tenant index coverage (`org_id` and/or `property_id` not present in explicit index definitions):

- `departments` (missing `property_id` index)
- `expenses` (missing `property_id` index)
- `inventory_items` (missing `org_id` index)
- `invoices` (missing `property_id` index)
- `member_permissions` (missing `org_id` index)
- `org_invites` (missing `org_id` index)
- `pricing_rules` (missing `property_id` index)
- `reservation_leads` (missing `property_id` index)
- `reservation_quotes` (missing `property_id` index)
- `room_types` (missing `property_id` index)
- `shifts` (missing `property_id` index)
- `staff_profiles` (missing `property_id` index)
- `stock_locations` (missing `property_id` index)
- `website_settings` (missing `property_id` index)

### P2 Findings (Standardization and quality improvements)

1. Table naming is inconsistent (`precheckin_*` vs `pre_checkin_*`).
2. Security model style is mixed (legacy broad/public policies alongside org-based policies).
3. Several enabled-RLS tables have no explicit policies, reducing clarity/auditability.
4. Tenant key strategy is not uniform (`org_id` only vs `property_id` only vs both) and likely intentional in places, but not centrally documented in schema comments.

## Focused Check: precheckin_sessions vs pre_checkin_sessions

From the analyzed dump:
- `precheckin_sessions`: `org_id` present, RLS enabled, one policy present.
- `pre_checkin_sessions`: `org_id` present, RLS disabled, no policies.
- `pre_checkin_submissions`: `org_id` present, RLS disabled, no policies.

Conclusion:
- The originally cited P0 issue for `precheckin_sessions` is not present in this specific STAGING dump.
- A P0 issue still exists on the underscore tables (`pre_checkin_sessions`, `pre_checkin_submissions`).
