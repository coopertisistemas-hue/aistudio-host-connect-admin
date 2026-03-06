-- Sprint 4.1 HOTFIX: Correct Status CHECK Constraint
-- Date: 2026-01-21
-- Purpose: Fix incorrect status values in CHECK constraint

-- Drop incorrect constraint (has uppercase DIRTY/CLEAN/INSPECTED/OOO)
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

-- Add correct constraint with lowercase canonical + legacy values
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check CHECK (status IN (
  -- Legacy values (backward compatibility)
  'available', 'occupied', 'maintenance',
  -- Canonical housekeeping values (lowercase)
  'dirty', 'cleaning', 'clean', 'inspected', 'out_of_order'
));

-- Verify new constraint
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.rooms'::regclass
  AND conname = 'rooms_status_check';
