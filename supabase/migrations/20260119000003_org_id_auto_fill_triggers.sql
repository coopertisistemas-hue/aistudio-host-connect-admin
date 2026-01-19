-- Migration: Auto-fill org_id triggers (CORRECTED)
-- Description: Automatically populate org_id for new records based on FK relationships
-- Date: 2026-01-19
-- Author: Supabase Security Team
-- IMPORTANT: Run this AFTER 20260119000002_enforce_org_id_constraints.sql
-- CORRECTED: Only creates triggers for tables that actually exist

-- =============================================================================
-- TRIGGER FUNCTIONS
-- =============================================================================

-- Function: Auto-fill org_id from property_id
CREATE OR REPLACE FUNCTION public.set_org_id_from_property()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.properties
    WHERE id = NEW.property_id;
    
    IF NEW.org_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine org_id: property_id % not found', NEW.property_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-fill org_id from room_type_id
CREATE OR REPLACE FUNCTION public.set_org_id_from_room_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.room_type_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.room_types
    WHERE id = NEW.room_type_id;
    
    IF NEW.org_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine org_id: room_type_id % not found', NEW.room_type_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-fill org_id from item_id (inventory_items)
CREATE OR REPLACE FUNCTION public.set_org_id_from_inventory_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.item_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM public.inventory_items
    WHERE id = NEW.item_id;
    
    IF NEW.org_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine org_id: item_id % not found', NEW.item_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- APPLY TRIGGERS (Only for existing tables)
-- =============================================================================

-- Tables with property_id that exist
DROP TRIGGER IF EXISTS tr_room_types_set_org ON public.room_types;
CREATE TRIGGER tr_room_types_set_org
BEFORE INSERT ON public.room_types
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();

DROP TRIGGER IF EXISTS tr_services_set_org ON public.services;
CREATE TRIGGER tr_services_set_org
BEFORE INSERT ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();

DROP TRIGGER IF EXISTS tr_pricing_rules_set_org ON public.pricing_rules;
CREATE TRIGGER tr_pricing_rules_set_org
BEFORE INSERT ON public.pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();

DROP TRIGGER IF EXISTS tr_website_settings_set_org ON public.website_settings;
CREATE TRIGGER tr_website_settings_set_org
BEFORE INSERT ON public.website_settings
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();

-- Tables with room_type_id
DROP TRIGGER IF EXISTS tr_room_type_inventory_set_org ON public.room_type_inventory;
CREATE TRIGGER tr_room_type_inventory_set_org
BEFORE INSERT ON public.room_type_inventory
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_room_type();

-- Tables with item_id (inventory)
DROP TRIGGER IF EXISTS tr_item_stock_set_org ON public.item_stock;
CREATE TRIGGER tr_item_stock_set_org
BEFORE INSERT ON public.item_stock
FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_inventory_item();

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify all triggers were created
DO $$
DECLARE
    expected_triggers text[] := ARRAY[
        'tr_room_types_set_org',
        'tr_services_set_org',
        'tr_pricing_rules_set_org',
        'tr_website_settings_set_org',
        'tr_room_type_inventory_set_org',
        'tr_item_stock_set_org'
    ];
    missing_triggers text[];
    trg_name text;
BEGIN
    FOREACH trg_name IN ARRAY expected_triggers
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.triggers t
            WHERE t.trigger_schema = 'public'
              AND t.trigger_name = trg_name
        ) THEN
            missing_triggers := array_append(missing_triggers, trg_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_triggers, 1) > 0 THEN
        RAISE EXCEPTION 'Missing triggers: %', array_to_string(missing_triggers, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All 6 auto-fill triggers created';
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUTO-FILL TRIGGERS COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ 3 trigger functions created';
    RAISE NOTICE '✓ 6 triggers applied to tables';
    RAISE NOTICE '✓ org_id will auto-fill on INSERT';
    RAISE NOTICE '========================================';
END $$;
