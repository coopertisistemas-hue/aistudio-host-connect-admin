-- Query to check existing tables and their columns
-- Run this first to verify table structure before creating indexes

-- 1. List all tables in public schema
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'booking_rooms',
    'booking_guests', 
    'booking_charges',
    'booking_groups',
    'guest_consents',
    'audit_log',
    'pre_checkin_sessions',
    'pre_checkin_submissions',
    'precheckin_sessions',
    'precheckin_submissions'
  )
ORDER BY table_name;

-- 2. Check columns for each suspected join table
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'booking_rooms',
    'booking_guests',
    'booking_charges',
    'audit_log'
  )
ORDER BY table_name, ordinal_position;
