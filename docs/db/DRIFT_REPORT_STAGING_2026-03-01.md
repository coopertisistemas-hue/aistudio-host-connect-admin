# Drift Report - STAGING vs Migrations - 2026-03-01

Compared sources:
- Live snapshot: `docs/db/SUPABASE_SCHEMA_STAGING_2026-03-01.sql`
- Migration history: `supabase/migrations/*.sql`

Scope and method:
- Lexical SQL comparison of object definitions (tables, functions, policies, triggers).
- Filtered migration set excludes:
  - `ROLLBACK_20251226170000_enforce_org_isolation.sql`
  - `20260119000006_multi_tenant_validation_tests.sql`
- This is a drift indicator, not a semantic migration replay.
- Rename/drop/recreate patterns may produce false positives; such cases are marked `UNKNOWN` when intent cannot be proven.

## Executive Summary

| Drift Bucket | Tables | Functions | Policies | Triggers |
|---|---:|---:|---:|---:|
| Present in dump, not found in migrations | 21 | 5 | 40 | 15 |
| Present in migrations, not found in dump | 2 | 0 | 81 | 15 |

Key interpretation:
- Drift is material, especially in policy/trigger naming and pre-checkin model evolution.
- Some differences appear to come from table replacement/renaming and policy rewrites over time.
- Exact intent per object remains `UNKNOWN` without replaying migration chain against an empty database.

## Objects Present in Dump but Not Found in Migrations

### Tables (21)

`departments`, `entity_photos`, `faqs`, `features`, `how_it_works_steps`, `integrations`, `lead_timeline_events`, `notifications`, `pricing_plans`, `reservation_leads`, `reservation_quotes`, `shift_assignments`, `shift_handoffs`, `shifts`, `staff_profiles`, `stock_check_items`, `stock_daily_checks`, `stock_items`, `stock_locations`, `stock_movements`, `testimonials`

### Functions (5)

`auto_set_accommodation_limit`, `calculate_movement_balance`, `get_user_role`, `is_org_admin_no_rls`, `update_stock_balance`

### Policies (40)

```text
bookings::Allow admins to manage all bookings or owner of property to man
bookings::Allow owner to update current_room_id on bookings
entity_photos::Allow admins to manage all photos or owner of entity to manage
expenses::Users can delete expenses for their properties
expenses::Users can insert expenses for their properties
expenses::Users can update expenses for their properties
expenses::Users can view expenses for their properties
faqs::Allow authenticated users to manage faqs
faqs::Allow public read access for faqs
features::Allow authenticated users to manage features
features::Allow public read access for features
guest_consents::Org members manage guest consents
how_it_works_steps::Allow authenticated users to manage steps
how_it_works_steps::Allow public read access for steps
integrations::Allow authenticated users to manage integrations
integrations::Allow public read access for visible integrations
invoices::Allow authenticated users to manage invoices for their properti
notifications::Users can delete their own notifications
notifications::Users can insert their own notifications
notifications::Users can update their own notifications
notifications::Users can view their own notifications
org_members::org_members_self_read
pricing_plans::Allow authenticated users to manage pricing plans
pricing_plans::Allow public read access for pricing plans
profiles::profiles_insert_self
profiles::profiles_read_authenticated
profiles::profiles_update_self
properties::Allow admins to manage all properties or owner to manage their
properties::Users can view their own properties
room_categories::Users can manage categories in their properties
room_categories::Users can view categories in their properties
room_types::Allow admins to manage all room types or owner of property to m
rooms::Allow owner to update last_booking_id on rooms
tasks::Users can delete tasks for their properties
tasks::Users can insert tasks for their properties
tasks::Users can update tasks for their properties
tasks::Users can view tasks for their properties
testimonials::Allow authenticated users to manage testimonials
testimonials::Allow public read access for visible testimonials
website_settings::Allow public read access for specific website settings
```

Note:
- Some policy names are truncated at PostgreSQL identifier limits in the dump.

### Triggers (15)

```text
expenses::handle_updated_at
faqs::handle_updated_at
features::handle_updated_at
hostconnect_onboarding::tr_check_filters
how_it_works_steps::handle_updated_at
integrations::handle_updated_at
invoices::handle_updated_at
pricing_plans::handle_updated_at
profiles::set_accommodation_limit_on_plan_change
profiles::trigger_prevent_super_admin_self_promotion
properties::on_auth_user_created
stock_movements::trg_calculate_balance_before_insert
stock_movements::trg_update_stock_after_movement
tasks::handle_updated_at
testimonials::handle_updated_at
```

## Objects Present in Migrations but Not Found in Dump

### Tables (2)

`booking_groups`, `property_photos`

### Functions (0)

No function names were found in this category by lexical scan.

### Policies (81)

```text
amenities::Enable delete for authenticated users
amenities::Enable insert for authenticated users
amenities::Enable read access for all users
amenities::Enable update for authenticated users
booking_charges::Enable insert for authenticated users
booking_charges::Enable read access for all users
booking_groups::Admins can delete booking_groups
booking_groups::Staff can insert booking_groups
booking_groups::Staff can update booking_groups
booking_groups::Users can view booking_groups in their org
bookings::Bookings are viewable by property owners.
bookings::Org: Users can delete bookings
bookings::Org: Users can insert bookings
bookings::Org: Users can update bookings
bookings::Org: Users can view bookings
bookings::Property owners can delete bookings.
bookings::Property owners can insert bookings.
bookings::Property owners can update bookings.
bookings::Users can delete bookings for own properties
bookings::Users can insert bookings for own properties
bookings::Users can update bookings for own properties
bookings::Users can view bookings for own properties
folio_items::Users can manage folio items in their org
folio_items::Users can view folio items in their org
folio_payments::Users can manage folio payments in their org
folio_payments::Users can view folio payments in their org
inventory_items::Users can delete inventory items of their org
inventory_items::Users can insert inventory items to their org
inventory_items::Users can update inventory items of their org
inventory_items::Users can view inventory items of their org
item_stock::Authenticated users can delete stock
item_stock::Authenticated users can modify stock
item_stock::Authenticated users can update stock
item_stock::Authenticated users can view stock
pricing_rules::Enable delete for users who own property
pricing_rules::Enable insert for authenticated users
pricing_rules::Enable read access for all users
pricing_rules::Enable update for users who own property
profiles::Public profiles are viewable by everyone.
profiles::Users can delete their own profile.
profiles::Users can insert their own profile.
profiles::Users can update own profile
profiles::Users can update their own profile.
profiles::Users can view own profile
profiles::Users can view profiles in their org
properties::Org: Users can delete properties
properties::Org: Users can insert properties
properties::Org: Users can update properties
properties::Org: Users can view properties
properties::Users can delete own properties
properties::Users can delete their own properties.
properties::Users can insert own properties
properties::Users can insert their own properties.
properties::Users can update own properties
properties::Users can update their own properties.
properties::Users can view own properties
properties::Users can view their own properties.
property_photos::Org: Users can manage photos
property_photos::Org: Users can view photos
property_photos::Property owners can delete photos.
property_photos::Property owners can insert photos.
property_photos::Property owners can update photos.
property_photos::Property photos are viewable by property owners.
property_photos::Users can delete photos for own properties
property_photos::Users can insert photos for own properties
property_photos::Users can update photos for own properties
property_photos::Users can view photos for own properties
room_type_inventory::Enable all access for authenticated users (Temporary for MVP)
room_type_inventory::Users can view room inventory if they have access to room type
rooms::Enable delete for users who own property
rooms::Enable insert for authenticated users
rooms::Enable read access for all users
rooms::Enable update for users who own property
rooms::Org: Users can view rooms
services::Enable read access for all users
storage::Users can delete own property photos
storage::Users can update own property photos
storage::Users can upload photos to own properties
storage::Users can view property photos
tickets::Org: Users can view tickets
website_settings::Enable read access for all users
```

### Triggers (15)

```text
DELETE::on_auth_user_created
amenities::handle_updated_at
booking_groups::set_updated_at_booking_groups
bookings::handle_bookings_updated_at
bookings::update_bookings_updated_at
profiles::handle_profiles_updated_at
profiles::on_auth_user_created
profiles::to
properties::enforce_accommodation_limit
properties::handle_properties_updated_at
properties::update_properties_updated_at
property_photos::handle_property_photos_updated_at
property_photos::tr_photos_set_org
property_photos::update_property_photos_updated_at
room_types::handle_updated_at
```

## High-Risk Drift Items

1. Pre-checkin model split (`precheckin_sessions` and `pre_checkin_sessions` coexist):
   - `pre_checkin_sessions` / `pre_checkin_submissions` are present in dump with RLS disabled.
   - `precheckin_sessions` has RLS enabled and policy coverage.
   - Risk: security posture depends on which table path the application uses.

2. Policy namespace divergence:
   - Large mismatch in policy names/sets suggests policy rewrites outside migration history or non-linear migration application.
   - Risk: hard to prove intended authorization model from git history only.

3. Trigger drift on lifecycle-critical tables (`properties`, `profiles`, `stock_movements`, etc.):
   - Trigger sets differ between migration scripts and dump.
   - Risk: side effects (updated_at, automation, stock calculations) may differ by environment.

4. Table drift for `booking_groups` and `property_photos`:
   - Referenced by migrations but absent in dump.
   - Potential outcomes: dropped, never applied, or renamed (`UNKNOWN` without replay/history trace).

## Confidence and Unknowns

- Confirmed from dump: current STAGING snapshot object state.
- Confirmed from migrations: scripted intent over time.
- `UNKNOWN`: exact timeline and whether drift came from manual SQL, partial migration runs, or deliberate object replacement.

Recommended next verification step (non-destructive):
- Replay migrations into a clean ephemeral DB and compare `pg_catalog` object signatures to this dump.
