-- Migration: Security Hardening (RLS & Policies)
-- Description: Fixes critical data leakage by enforcing strict Owner-Based RLS on sensitive tables.
-- Date: 2025-12-25

-- 1. Helper Function for Centralized Access Control
CREATE OR REPLACE FUNCTION public.check_user_access(target_property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
BEGIN
  -- 1. Allow Super Admins (role = 'admin' in profiles)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN true;
  END IF;

  -- 2. Allow Property Owners
  IF EXISTS (SELECT 1 FROM public.properties WHERE id = target_property_id AND user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_access(uuid) TO authenticated;


-- 2. Security Hardening for 'rooms'
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rooms;
DROP POLICY IF EXISTS "Enable update for users who own property" ON public.rooms;
DROP POLICY IF EXISTS "Enable delete for users who own property" ON public.rooms;

CREATE POLICY "Users can view rooms of their properties" ON public.rooms FOR SELECT USING (public.check_user_access(property_id));
CREATE POLICY "Users can insert rooms for their properties" ON public.rooms FOR INSERT WITH CHECK (public.check_user_access(property_id));
CREATE POLICY "Users can update rooms of their properties" ON public.rooms FOR UPDATE USING (public.check_user_access(property_id));
CREATE POLICY "Users can delete rooms of their properties" ON public.rooms FOR DELETE USING (public.check_user_access(property_id));


-- 3. Security Hardening for 'pricing_rules'
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pricing_rules;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.pricing_rules;
DROP POLICY IF EXISTS "Enable update for users who own property" ON public.pricing_rules;
DROP POLICY IF EXISTS "Enable delete for users who own property" ON public.pricing_rules;

CREATE POLICY "Users can view rules of their properties" ON public.pricing_rules FOR SELECT USING (public.check_user_access(property_id));
CREATE POLICY "Users can insert rules for their properties" ON public.pricing_rules FOR INSERT WITH CHECK (public.check_user_access(property_id));
CREATE POLICY "Users can update rules of their properties" ON public.pricing_rules FOR UPDATE USING (public.check_user_access(property_id));
CREATE POLICY "Users can delete rules of their properties" ON public.pricing_rules FOR DELETE USING (public.check_user_access(property_id));


-- 4. Security Hardening for 'booking_charges'
ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.booking_charges;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.booking_charges;
-- Note: booking_charges needs to link to property via booking_id
-- We need a specific check for booking_charges because it has booking_id, not property_id directly

CREATE OR REPLACE FUNCTION public.check_booking_access(target_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_property_id uuid;
BEGIN
  SELECT property_id INTO linked_property_id FROM public.bookings WHERE id = target_booking_id;
  
  IF linked_property_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.check_user_access(linked_property_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_booking_access(uuid) TO authenticated;

CREATE POLICY "Users can view charges of their bookings" ON public.booking_charges FOR SELECT USING (public.check_booking_access(booking_id));
CREATE POLICY "Users can insert charges for their bookings" ON public.booking_charges FOR INSERT WITH CHECK (public.check_booking_access(booking_id));
CREATE POLICY "Users can update charges of their bookings" ON public.booking_charges FOR UPDATE USING (public.check_booking_access(booking_id));
CREATE POLICY "Users can delete charges of their bookings" ON public.booking_charges FOR DELETE USING (public.check_booking_access(booking_id));


-- 5. Hardening Orphan Tables (Tasks, Expenses, Services, Invoices)

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access tasks" ON public.tasks; -- Just in case
CREATE POLICY "Manage own tasks" ON public.tasks FOR ALL USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access expenses" ON public.expenses;
CREATE POLICY "Manage own expenses" ON public.expenses FOR ALL USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));

-- Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access services" ON public.services;
CREATE POLICY "Manage own services" ON public.services FOR ALL USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access invoices" ON public.invoices;
CREATE POLICY "Manage own invoices" ON public.invoices FOR ALL USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));

