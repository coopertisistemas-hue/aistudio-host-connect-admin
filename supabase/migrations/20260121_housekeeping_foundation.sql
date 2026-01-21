-- Sprint 4.1: Housekeeping Foundation Migration
-- Date: 2026-01-21
-- Purpose: Add org_id, canonical housekeeping status values, indexes, and audit fields

-- ====================================
-- PHASE 1: ADD COLUMNS (SAFE, ADDITIVE)
-- ====================================

-- Add org_id column (nullable initially for safe backfill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.rooms 
    ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added org_id column to rooms table';
  ELSE
    RAISE NOTICE 'org_id column already exists in rooms table';
  END IF;
END$$;

-- Add updated_by column for audit trail (optional, nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.rooms 
    ADD COLUMN updated_by uuid REFERENCES auth.users(id);
    
    RAISE NOTICE 'Added updated_by column to rooms table';
  ELSE
    RAISE NOTICE 'updated_by column already exists in rooms table';
  END IF;
END$$;

-- ====================================
-- PHASE 2: BACKFILL DATA
-- ====================================

-- Backfill org_id from properties table
DO $$
DECLARE
  rows_updated integer;
BEGIN
  UPDATE public.rooms r
  SET org_id = p.org_id
  FROM public.properties p
  WHERE r.property_id = p.id 
    AND r.org_id IS NULL;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Backfilled org_id for % rooms', rows_updated;
END$$;

-- Verify backfill (all rooms must have org_id)
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.rooms
  WHERE org_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill failed: % rooms still have NULL org_id', null_count;
  ELSE
    RAISE NOTICE 'Backfill verification: All rooms have org_id';
  END IF;
END$$;

-- ====================================
-- PHASE 3: APPLY CONSTRAINTS
-- ====================================

-- Make org_id NOT NULL (after backfill verification)
DO $$
BEGIN
  ALTER TABLE public.rooms 
  ALTER COLUMN org_id SET NOT NULL;
  
  RAISE NOTICE 'Set org_id to NOT NULL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to set org_id NOT NULL. Ensure all rows have org_id: %', SQLERRM;
END$$;

-- Add CHECK constraint for status values (legacy + canonical)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'rooms' AND constraint_name = 'rooms_status_check'
  ) THEN
    ALTER TABLE public.rooms 
    ADD CONSTRAINT rooms_status_check CHECK (status IN (
      -- Legacy values (backward compatibility)
      'available', 'occupied', 'maintenance',
      -- Canonical housekeeping values (new)
      'dirty', 'cleaning', 'clean', 'inspected', 'out_of_order'
    ));
    
    RAISE NOTICE 'Added status CHECK constraint with legacy + canonical values';
  ELSE
    RAISE NOTICE 'status CHECK constraint already exists';
  END IF;
END$$;

-- ====================================
-- PHASE 4: ADD OPERATIONAL INDEXES
-- ====================================

-- Index for org + property + status filtering (housekeeping queries)
CREATE INDEX IF NOT EXISTS idx_rooms_org_property_status 
ON public.rooms(org_id, property_id, status);

-- Index for recent changes (audit queries)
CREATE INDEX IF NOT EXISTS idx_rooms_org_property_updated 
ON public.rooms(org_id, property_id, updated_at DESC);

-- Index for property + status (backward compat, already partially covered)
CREATE INDEX IF NOT EXISTS idx_rooms_property_status 
ON public.rooms(property_id, status);

RAISE NOTICE 'Created operational indexes for housekeeping queries';

-- ====================================
-- PHASE 5: UPDATE RLS POLICIES
-- ====================================

-- Drop old policies (property-owner based, less secure)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rooms;
DROP POLICY IF EXISTS "Enable update for users who own property" ON public.rooms;
DROP POLICY IF EXISTS "Enable delete for users who own property" ON public.rooms;

-- Create new org-based policies (more secure, multi-tenant)

-- SELECT: Users can view rooms in their org
CREATE POLICY "org_select_rooms" ON public.rooms
FOR SELECT
USING (
  org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID)
);

-- INSERT: Authenticated users can insert rooms (org_id will be set by app)
CREATE POLICY "org_insert_rooms" ON public.rooms
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID)
);

-- UPDATE: Users can update rooms in their org
CREATE POLICY "org_update_rooms" ON public.rooms
FOR UPDATE
USING (
  org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID)
);

-- DELETE: Users can delete rooms in their org
CREATE POLICY "org_delete_rooms" ON public.rooms
FOR DELETE
USING (
  org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID)
);

RAISE NOTICE 'Updated RLS policies to use org_id isolation';

-- ====================================
-- PHASE 6: VERIFICATION
-- ====================================

-- Verify table structure
DO $$
BEGIN
  -- Check org_id exists and is NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rooms' 
    AND column_name = 'org_id'
    AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'org_id column is not NOT NULL';
  END IF;
  
  -- Check status constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'rooms' AND constraint_name = 'rooms_status_check'
  ) THEN
    RAISE EXCEPTION 'status CHECK constraint does not exist';
  END IF;
  
  -- Check indexes exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'rooms' AND indexname = 'idx_rooms_org_property_status'
  ) THEN
    RAISE EXCEPTION 'idx_rooms_org_property_status index does not exist';
  END IF;
  
  RAISE NOTICE 'Migration verification: ALL CHECKS PASSED';
END$$;

-- ====================================
-- FINAL REPORT
-- ====================================

-- Show rooms table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rooms'
ORDER BY ordinal_position;

-- Show indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'rooms'
ORDER BY indexname;

-- Show constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.rooms'::regclass
ORDER BY conname;

-- Count rooms by status
SELECT status, COUNT(*) as count
FROM public.rooms
GROUP BY status
ORDER BY count DESC;
