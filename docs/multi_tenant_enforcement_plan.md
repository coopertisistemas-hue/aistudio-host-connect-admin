# Multi-Tenant Enforcement — Implementation Plan

**Date**: 2026-01-19  
**Task**: TASK 2 — Multi-Tenant Enforcement  
**Objective**: Ensure strict data isolation between organizations and properties  
**Status**: Planning Phase

---

## 1. Architectural Overview

### Current State
- **48 tables** in production
- **15+ tables missing `org_id`** for proper isolation
- **7 tables with global access** (qual = true)
- **RLS enabled** on all tables but policies are too permissive

### Target State
- **Every business table** has `org_id` NOT NULL
- **Operational tables** have both `org_id` AND `property_id`
- **Strict RLS policies** prevent cross-org/cross-property access
- **Admin/Staff users** explicitly handled with bypass functions

### Security Guarantee
> A user authenticated in Org A must **NEVER** see or mutate data from Org B, even via crafted queries.

---

## 2. Tables Requiring org_id

### Priority 1: Critical (Global Access - URGENT)

| Table | Current State | Action Required | Risk Level |
|-------|---------------|-----------------|------------|
| `amenities` | No org_id, global access | Add org_id, decide: global or org-specific | 🔴 CRITICAL |
| `room_categories` | No org_id, global access | Add org_id, lock down RLS | 🔴 CRITICAL |
| `room_types` | property_id only, global access | Add org_id, strict RLS | 🔴 CRITICAL |
| `services` | property_id only, global read | Add org_id, strict RLS | 🔴 CRITICAL |
| `item_stock` | No org_id, global view | Add org_id, strict RLS | 🔴 CRITICAL |
| `stock_items` | No org_id, global view | Add org_id, strict RLS | 🔴 CRITICAL |
| `room_type_inventory` | No org_id, "temporary" bypass | Add org_id, strict RLS | 🔴 CRITICAL |

### Priority 2: High (Property-Scoped Only)

| Table | Current State | Action Required | Risk Level |
|-------|---------------|-----------------|------------|
| `staff_profiles` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `invoices` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `expenses` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `departments` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `pricing_rules` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `website_settings` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `pantry_stock` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `shifts` | property_id only | Add org_id for consistency | 🟡 HIGH |
| `tasks` | property_id only | Add org_id for consistency | 🟡 HIGH |

### Priority 3: Medium (Generic/Needs Review)

| Table | Current State | Action Required | Risk Level |
|-------|---------------|-----------------|------------|
| `entity_photos` | Generic (entity_type/entity_id) | Add org_id via trigger | 🟢 MEDIUM |
| `shift_assignments` | No direct isolation | Add org_id via FK | 🟢 MEDIUM |
| `stock_movements` | No direct isolation | Add org_id via FK | 🟢 MEDIUM |

### Excluded (By Design)

| Table | Reason |
|-------|--------|
| `profiles` | User-scoped (1:1 with auth.users) |
| `hostconnect_staff` | Global staff list (intentional) |
| `audit_log` | Global audit (staff-only access) |
| `ticket_comments` | Scoped via tickets FK |
| `idea_comments` | Scoped via ideas FK |

---

## 3. Migration Strategy

### Phase 1: Add Columns (Idempotent)

```sql
-- Migration: 20260119000000_add_org_id_to_critical_tables.sql
-- Description: Add org_id column to all critical tables for multi-tenant isolation
-- Date: 2026-01-19

-- =============================================================================
-- PRIORITY 1: CRITICAL TABLES
-- =============================================================================

-- 1. amenities
-- Decision: Make org-specific (each org manages their own amenities)
ALTER TABLE public.amenities 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_amenities_org_id ON public.amenities(org_id);

-- 2. room_categories  
ALTER TABLE public.room_categories 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_room_categories_org_id ON public.room_categories(org_id);

-- 3. room_types
ALTER TABLE public.room_types 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_room_types_org_id ON public.room_types(org_id);

-- 4. services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_services_org_id ON public.services(org_id);

-- 5. item_stock
ALTER TABLE public.item_stock 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_item_stock_org_id ON public.item_stock(org_id);

-- 6. stock_items
ALTER TABLE public.stock_items 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stock_items_org_id ON public.stock_items(org_id);

-- 7. room_type_inventory
ALTER TABLE public.room_type_inventory 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_room_type_inventory_org_id ON public.room_type_inventory(org_id);

-- =============================================================================
-- PRIORITY 2: HIGH PRIORITY TABLES
-- =============================================================================

-- 8. staff_profiles
ALTER TABLE public.staff_profiles 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_staff_profiles_org_id ON public.staff_profiles(org_id);

-- 9. invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);

-- 10. expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON public.expenses(org_id);

-- 11. departments
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_departments_org_id ON public.departments(org_id);

-- 12. pricing_rules
ALTER TABLE public.pricing_rules 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pricing_rules_org_id ON public.pricing_rules(org_id);

-- 13. website_settings
ALTER TABLE public.website_settings 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_website_settings_org_id ON public.website_settings(org_id);

-- 14. pantry_stock
ALTER TABLE public.pantry_stock 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pantry_stock_org_id ON public.pantry_stock(org_id);

-- 15. shifts
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shifts_org_id ON public.shifts(org_id);

-- 16. tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON public.tasks(org_id);

-- =============================================================================
-- PRIORITY 3: MEDIUM PRIORITY TABLES
-- =============================================================================

-- 17. entity_photos
ALTER TABLE public.entity_photos 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_entity_photos_org_id ON public.entity_photos(org_id);

-- 18. shift_assignments
ALTER TABLE public.shift_assignments 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shift_assignments_org_id ON public.shift_assignments(org_id);

-- 19. stock_movements
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stock_movements_org_id ON public.stock_movements(org_id);
```

### Phase 2: Backfill Data

```sql
-- Migration: 20260119000001_backfill_org_id.sql
-- Description: Backfill org_id from properties for all tables
-- Date: 2026-01-19

-- =============================================================================
-- BACKFILL STRATEGY
-- =============================================================================

-- Tables with property_id: Backfill from properties
UPDATE public.room_types rt
SET org_id = p.org_id
FROM public.properties p
WHERE rt.property_id = p.id
  AND rt.org_id IS NULL;

UPDATE public.services s
SET org_id = p.org_id
FROM public.properties p
WHERE s.property_id = p.id
  AND s.org_id IS NULL;

UPDATE public.staff_profiles sp
SET org_id = p.org_id
FROM public.properties p
WHERE sp.property_id = p.id
  AND sp.org_id IS NULL;

UPDATE public.invoices i
SET org_id = p.org_id
FROM public.properties p
WHERE i.property_id = p.id
  AND i.org_id IS NULL;

UPDATE public.expenses e
SET org_id = p.org_id
FROM public.properties p
WHERE e.property_id = p.id
  AND e.org_id IS NULL;

UPDATE public.departments d
SET org_id = p.org_id
FROM public.properties p
WHERE d.property_id = p.id
  AND d.org_id IS NULL;

UPDATE public.pricing_rules pr
SET org_id = p.org_id
FROM public.properties p
WHERE pr.property_id = p.id
  AND pr.org_id IS NULL;

UPDATE public.website_settings ws
SET org_id = p.org_id
FROM public.properties p
WHERE ws.property_id = p.id
  AND ws.org_id IS NULL;

UPDATE public.pantry_stock ps
SET org_id = p.org_id
FROM public.properties p
WHERE ps.property_id = p.id
  AND ps.org_id IS NULL;

UPDATE public.shifts sh
SET org_id = p.org_id
FROM public.properties p
WHERE sh.property_id = p.id
  AND sh.org_id IS NULL;

UPDATE public.tasks t
SET org_id = p.org_id
FROM public.properties p
WHERE t.property_id = p.id
  AND t.org_id IS NULL;

-- Tables with room_type_id: Backfill via room_types -> properties
UPDATE public.room_type_inventory rti
SET org_id = p.org_id
FROM public.room_types rt
JOIN public.properties p ON p.id = rt.property_id
WHERE rti.room_type_id = rt.id
  AND rti.org_id IS NULL;

-- Tables with item_id: Backfill from inventory_items (which already has org_id)
UPDATE public.item_stock ist
SET org_id = ii.org_id
FROM public.inventory_items ii
WHERE ist.item_id = ii.id
  AND ist.org_id IS NULL;

-- stock_items: Needs business logic decision
-- Option A: Assign to first org (temporary)
-- Option B: Make global (keep NULL)
-- Option C: Duplicate for each org
-- DECISION REQUIRED FROM USER

-- amenities: Needs business logic decision
-- Option A: Make org-specific (duplicate for each org)
-- Option B: Keep global (NULL org_id allowed)
-- DECISION REQUIRED FROM USER

-- room_categories: Needs business logic decision
-- Similar to amenities
-- DECISION REQUIRED FROM USER

-- entity_photos: Backfill based on entity_type
UPDATE public.entity_photos ep
SET org_id = p.org_id
FROM public.properties p
WHERE ep.entity_type = 'property'
  AND ep.entity_id::uuid = p.id
  AND ep.org_id IS NULL;

UPDATE public.entity_photos ep
SET org_id = rt.org_id
FROM public.room_types rt
WHERE ep.entity_type = 'room_type'
  AND ep.entity_id::uuid = rt.id
  AND ep.org_id IS NULL;

-- shift_assignments: Backfill via shifts
UPDATE public.shift_assignments sa
SET org_id = sh.org_id
FROM public.shifts sh
WHERE sa.shift_id = sh.id
  AND sa.org_id IS NULL;

-- stock_movements: Backfill via stock_items or item_stock
-- Needs FK analysis to determine correct source
```

### Phase 3: Enforce NOT NULL

```sql
-- Migration: 20260119000002_enforce_org_id_not_null.sql
-- Description: Make org_id NOT NULL after backfill validation
-- Date: 2026-01-19

-- IMPORTANT: Only run after validating backfill is 100% complete

-- Validate before enforcing
DO $$
DECLARE
    null_count integer;
BEGIN
    -- Check room_types
    SELECT COUNT(*) INTO null_count FROM public.room_types WHERE org_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot enforce NOT NULL: room_types has % rows with NULL org_id', null_count;
    END IF;
    
    -- Check services
    SELECT COUNT(*) INTO null_count FROM public.services WHERE org_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot enforce NOT NULL: services has % rows with NULL org_id', null_count;
    END IF;
    
    -- Add more checks for each table...
    
    RAISE NOTICE 'Validation passed. Proceeding with NOT NULL enforcement.';
END $$;

-- Enforce NOT NULL on tables with property_id (safe to enforce)
ALTER TABLE public.room_types ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.staff_profiles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.pricing_rules ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.website_settings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.pantry_stock ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.shifts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.room_type_inventory ALTER COLUMN org_id SET NOT NULL;

-- Tables requiring business decision (DO NOT enforce yet)
-- ALTER TABLE public.amenities ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE public.room_categories ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE public.stock_items ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE public.item_stock ALTER COLUMN org_id SET NOT NULL;
```

---

## 4. Strict RLS Policies

### Template for Org-Isolated Tables

```sql
-- Migration: 20260119000003_strict_rls_policies.sql
-- Description: Implement strict RLS policies for multi-tenant isolation
-- Date: 2026-01-19

-- =============================================================================
-- POLICY TEMPLATE (Apply to all org-isolated tables)
-- =============================================================================

-- DROP existing overly permissive policies
-- CREATE new strict policies using helper functions

-- =============================================================================
-- EXAMPLE: amenities (if made org-specific)
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Manage all amenities" ON public.amenities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.amenities;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.amenities;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.amenities;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.amenities;

-- SELECT: Org members can view their org's amenities
CREATE POLICY "org_members_select_amenities" 
ON public.amenities
FOR SELECT
USING (
  -- Org members can see their org's data
  public.is_org_member(org_id)
  OR
  -- HostConnect staff can see all (for support)
  public.is_hostconnect_staff()
);

-- INSERT: Org admins can create amenities for their org
CREATE POLICY "org_admins_insert_amenities" 
ON public.amenities
FOR INSERT
WITH CHECK (
  -- Must be admin of the org
  public.is_org_admin(org_id)
);

-- UPDATE: Org admins can update their org's amenities
CREATE POLICY "org_admins_update_amenities" 
ON public.amenities
FOR UPDATE
USING (
  -- Must be admin of the org
  public.is_org_admin(org_id)
  OR
  -- Staff can update for support
  public.is_hostconnect_staff()
);

-- DELETE: Org admins can delete their org's amenities
CREATE POLICY "org_admins_delete_amenities" 
ON public.amenities
FOR DELETE
USING (
  -- Must be admin of the org
  public.is_org_admin(org_id)
);

-- =============================================================================
-- room_categories (similar pattern)
-- =============================================================================

DROP POLICY IF EXISTS "Manage all categories" ON public.room_categories;

CREATE POLICY "org_members_select_room_categories" 
ON public.room_categories
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_admins_insert_room_categories" 
ON public.room_categories
FOR INSERT
WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "org_admins_update_room_categories" 
ON public.room_categories
FOR UPDATE
USING (public.is_org_admin(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_admins_delete_room_categories" 
ON public.room_categories
FOR DELETE
USING (public.is_org_admin(org_id));

-- =============================================================================
-- room_types (has both org_id and property_id)
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_manage_room_types" ON public.room_types;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.room_types;

-- SELECT: Org members can view room types in their org
CREATE POLICY "org_members_select_room_types" 
ON public.room_types
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

-- INSERT: Org admins can create room types
CREATE POLICY "org_admins_insert_room_types" 
ON public.room_types
FOR INSERT
WITH CHECK (
  -- Must be admin of the org
  public.is_org_admin(org_id)
  AND
  -- Property must belong to the same org
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = room_types.property_id
    AND p.org_id = room_types.org_id
  )
);

-- UPDATE: Org admins can update room types
CREATE POLICY "org_admins_update_room_types" 
ON public.room_types
FOR UPDATE
USING (public.is_org_admin(org_id) OR public.is_hostconnect_staff());

-- DELETE: Org admins can delete room types
CREATE POLICY "org_admins_delete_room_types" 
ON public.room_types
FOR DELETE
USING (public.is_org_admin(org_id));

-- =============================================================================
-- services (has both org_id and property_id)
-- =============================================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;

CREATE POLICY "org_members_select_services" 
ON public.services
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_members_insert_services" 
ON public.services
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id)
  AND
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = services.property_id
    AND p.org_id = services.org_id
  )
);

CREATE POLICY "org_members_update_services" 
ON public.services
FOR UPDATE
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_admins_delete_services" 
ON public.services
FOR DELETE
USING (public.is_org_admin(org_id));

-- =============================================================================
-- item_stock, stock_items (inventory system)
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can view stock" ON public.item_stock;
DROP POLICY IF EXISTS "Authenticated users can view stock items" ON public.stock_items;

-- item_stock
CREATE POLICY "org_members_select_item_stock" 
ON public.item_stock
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_members_manage_item_stock" 
ON public.item_stock
FOR ALL
USING (public.is_org_member(org_id));

-- stock_items
CREATE POLICY "org_members_select_stock_items" 
ON public.stock_items
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_members_manage_stock_items" 
ON public.stock_items
FOR ALL
USING (public.is_org_member(org_id));

-- =============================================================================
-- room_type_inventory (CRITICAL - remove "temporary" policy)
-- =============================================================================

DROP POLICY IF EXISTS "Enable all access for authenticated users (Temporary for MVP)" ON public.room_type_inventory;
DROP POLICY IF EXISTS "Users can view room inventory if they have access to room type" ON public.room_type_inventory;

CREATE POLICY "org_members_select_room_type_inventory" 
ON public.room_type_inventory
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

CREATE POLICY "org_members_manage_room_type_inventory" 
ON public.room_type_inventory
FOR ALL
USING (public.is_org_member(org_id));
```

### Optimized Policies for inventory_items

```sql
-- =============================================================================
-- inventory_items (replace subquery with helper function)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view inventory items of their org" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can insert inventory items to their org" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can update inventory items of their org" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can delete inventory items of their org" ON public.inventory_items;

-- SELECT: Use helper function instead of subquery
CREATE POLICY "org_members_select_inventory_items" 
ON public.inventory_items
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

-- INSERT
CREATE POLICY "org_members_insert_inventory_items" 
ON public.inventory_items
FOR INSERT
WITH CHECK (public.is_org_member(org_id));

-- UPDATE
CREATE POLICY "org_members_update_inventory_items" 
ON public.inventory_items
FOR UPDATE
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());

-- DELETE
CREATE POLICY "org_admins_delete_inventory_items" 
ON public.inventory_items
FOR DELETE
USING (public.is_org_admin(org_id));
```

---

## 5. Auto-Fill Triggers

```sql
-- Migration: 20260119000004_org_id_auto_fill_triggers.sql
-- Description: Auto-fill org_id for tables with FK relationships
-- Date: 2026-01-19

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- Auto-fill org_id from room_type
CREATE OR REPLACE FUNCTION public.set_org_id_from_room_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.room_type_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.room_types
    WHERE id = NEW.room_type_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-fill org_id from shift
CREATE OR REPLACE FUNCTION public.set_org_id_from_shift()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.shift_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.shifts
    WHERE id = NEW.shift_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-fill org_id from inventory_item
CREATE OR REPLACE FUNCTION public.set_org_id_from_inventory_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.item_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.inventory_items
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- APPLY TRIGGERS
-- =============================================================================

-- room_type_inventory
DROP TRIGGER IF EXISTS tr_room_type_inventory_set_org ON public.room_type_inventory;
CREATE TRIGGER tr_room_type_inventory_set_org
BEFORE INSERT ON public.room_type_inventory
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_room_type();

-- shift_assignments
DROP TRIGGER IF EXISTS tr_shift_assignments_set_org ON public.shift_assignments;
CREATE TRIGGER tr_shift_assignments_set_org
BEFORE INSERT ON public.shift_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_shift();

-- item_stock
DROP TRIGGER IF EXISTS tr_item_stock_set_org ON public.item_stock;
CREATE TRIGGER tr_item_stock_set_org
BEFORE INSERT ON public.item_stock
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_inventory_item();

-- stock_movements
DROP TRIGGER IF EXISTS tr_stock_movements_set_org ON public.stock_movements;
CREATE TRIGGER tr_stock_movements_set_org
BEFORE INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_inventory_item();
```

---

## 6. Validation Queries

### Test Multi-Tenant Isolation

```sql
-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- 1. Verify all critical tables have org_id
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'org_id'
        ) THEN 'HAS org_id'
        ELSE 'MISSING org_id'
    END as org_id_status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND t.table_name NOT IN ('profiles', 'hostconnect_staff', 'audit_log', 'ticket_comments', 'idea_comments')
ORDER BY table_name;

-- 2. Check for NULL org_id values (should be 0 after backfill)
SELECT 
    'amenities' as table_name, COUNT(*) as null_count 
FROM public.amenities WHERE org_id IS NULL
UNION ALL
SELECT 'room_types', COUNT(*) FROM public.room_types WHERE org_id IS NULL
UNION ALL
SELECT 'services', COUNT(*) FROM public.services WHERE org_id IS NULL
UNION ALL
SELECT 'item_stock', COUNT(*) FROM public.item_stock WHERE org_id IS NULL
UNION ALL
SELECT 'stock_items', COUNT(*) FROM public.stock_items WHERE org_id IS NULL
UNION ALL
SELECT 'room_type_inventory', COUNT(*) FROM public.room_type_inventory WHERE org_id IS NULL;

-- 3. Verify RLS policies exist and are strict
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%is_org_member%' OR qual LIKE '%is_org_admin%' THEN 'STRICT'
        WHEN qual = 'true' THEN 'GLOBAL (BAD)'
        WHEN qual LIKE '%authenticated%' THEN 'TOO PERMISSIVE'
        ELSE 'REVIEW NEEDED'
    END as policy_strength
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'amenities', 'room_types', 'room_categories', 'services',
    'item_stock', 'stock_items', 'room_type_inventory'
)
ORDER BY tablename, policyname;

-- 4. Test cross-org isolation (simulate user in Org A trying to access Org B)
-- This should return 0 rows
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_in_org_a>';

-- Should return ONLY Org A's data
SELECT COUNT(*) as org_a_properties FROM public.properties;
SELECT COUNT(*) as org_a_room_types FROM public.room_types;
SELECT COUNT(*) as org_a_amenities FROM public.amenities;

-- Try to access Org B's data directly (should fail or return 0)
SELECT COUNT(*) as org_b_properties 
FROM public.properties 
WHERE org_id = '<org_b_id>';  -- Should return 0 due to RLS

RESET ROLE;
```

---

## 7. Business Decisions Required

### Decision 1: amenities Table

**Options**:
- **A) Org-Specific**: Each org manages their own amenities (recommended)
  - Pros: Full isolation, customization per org
  - Cons: Duplication of common amenities
  
- **B) Global**: Keep amenities global, allow NULL org_id
  - Pros: No duplication, shared catalog
  - Cons: Any org can modify global amenities
  
- **C) Hybrid**: System amenities (NULL org_id) + org-specific
  - Pros: Best of both worlds
  - Cons: More complex logic

**Recommendation**: Option A (Org-Specific) for security

### Decision 2: room_categories Table

**Same options as amenities**

**Recommendation**: Option A (Org-Specific)

### Decision 3: stock_items Table

**Options**:
- **A) Org-Specific**: Each org has their own stock catalog
- **B) Global**: Shared catalog across orgs
- **C) Hybrid**: System catalog + org-specific items

**Recommendation**: Option A (Org-Specific)

---

## 8. Rollback Plan

```sql
-- Migration: ROLLBACK_20260119000000_multi_tenant_enforcement.sql
-- Description: Rollback multi-tenant enforcement if needed
-- Date: 2026-01-19

-- WARNING: This will remove org_id columns and revert to old policies
-- Only use in emergency

-- Drop NOT NULL constraints
ALTER TABLE public.room_types ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE public.services ALTER COLUMN org_id DROP NOT NULL;
-- ... (all tables)

-- Drop new strict policies
DROP POLICY IF EXISTS "org_members_select_amenities" ON public.amenities;
DROP POLICY IF EXISTS "org_admins_insert_amenities" ON public.amenities;
-- ... (all new policies)

-- Restore old policies (if needed)
-- CREATE POLICY "Manage all amenities" ON public.amenities FOR ALL USING (true);

-- Drop org_id columns (DESTRUCTIVE - data loss)
-- ALTER TABLE public.amenities DROP COLUMN org_id;
-- ... (all tables)
```

---

## 9. Implementation Checklist

### Pre-Implementation
- [ ] Review business decisions (amenities, room_categories, stock_items)
- [ ] Backup database
- [ ] Test migrations in staging environment
- [ ] Prepare rollback plan

### Phase 1: Add Columns (30 minutes)
- [ ] Run migration: `20260119000000_add_org_id_to_critical_tables.sql`
- [ ] Verify columns added successfully
- [ ] Verify indexes created

### Phase 2: Backfill Data (1 hour)
- [ ] Run migration: `20260119000001_backfill_org_id.sql`
- [ ] Verify NULL count = 0 for all tables
- [ ] Handle special cases (amenities, room_categories, stock_items)

### Phase 3: Enforce NOT NULL (15 minutes)
- [ ] Run validation queries
- [ ] Run migration: `20260119000002_enforce_org_id_not_null.sql`
- [ ] Verify constraints applied

### Phase 4: Strict RLS Policies (1 hour)
- [ ] Run migration: `20260119000003_strict_rls_policies.sql`
- [ ] Verify old policies dropped
- [ ] Verify new policies created
- [ ] Test with real user accounts

### Phase 5: Auto-Fill Triggers (30 minutes)
- [ ] Run migration: `20260119000004_org_id_auto_fill_triggers.sql`
- [ ] Test triggers with INSERT operations
- [ ] Verify org_id auto-populated

### Post-Implementation
- [ ] Run full validation suite
- [ ] Test cross-org isolation
- [ ] Performance testing
- [ ] Update documentation

---

## 10. Success Criteria

✅ **All critical tables have org_id column**  
✅ **No NULL org_id values in production data**  
✅ **All RLS policies use helper functions (no qual = true)**  
✅ **Cross-org access returns 0 rows**  
✅ **Performance acceptable (< 100ms for typical queries)**  
✅ **Staff users can access all orgs (for support)**  
✅ **Regular users can ONLY access their org's data**

---

**Status**: ⏳ AWAITING APPROVAL  
**Next Step**: Review business decisions and approve migration execution  
**Estimated Total Time**: 3-4 hours  
**Risk Level**: MEDIUM (with proper testing and rollback plan)
