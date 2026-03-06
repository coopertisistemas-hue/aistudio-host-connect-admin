-- SP1-B Structural Fingerprint (read-only, deterministic)
-- Output sections:
--   TABLE
--   COLUMN
--   CONSTRAINT
--   INDEX
--   TRIGGER
--
-- Intended usage:
--   psql --csv -f scripts/sql/structural_fingerprint.sql

WITH table_rows AS (
  SELECT
    'TABLE'::text AS section,
    n.nspname::text AS schema_name,
    c.relname::text AS object_name,
    ''::text AS sub_object,
    ''::text AS details
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
column_rows AS (
  SELECT
    'COLUMN'::text AS section,
    c.table_schema::text AS schema_name,
    c.table_name::text AS object_name,
    c.column_name::text AS sub_object,
    (
      'type=' || c.data_type ||
      ';nullable=' || c.is_nullable ||
      ';default=' || COALESCE(c.column_default, '')
    )::text AS details
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
),
constraint_rows AS (
  SELECT
    'CONSTRAINT'::text AS section,
    n.nspname::text AS schema_name,
    t.relname::text AS object_name,
    con.conname::text AS sub_object,
    (
      'type=' || con.contype::text ||
      ';def=' || regexp_replace(pg_get_constraintdef(con.oid), '\s+', ' ', 'g')
    )::text AS details
  FROM pg_constraint con
  JOIN pg_class t ON t.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND con.contype IN ('p', 'f', 'u', 'c')
),
index_rows AS (
  SELECT
    'INDEX'::text AS section,
    schemaname::text AS schema_name,
    tablename::text AS object_name,
    indexname::text AS sub_object,
    regexp_replace(indexdef, '\s+', ' ', 'g')::text AS details
  FROM pg_indexes
  WHERE schemaname = 'public'
),
trigger_rows AS (
  SELECT
    'TRIGGER'::text AS section,
    n.nspname::text AS schema_name,
    c.relname::text AS object_name,
    t.tgname::text AS sub_object,
    regexp_replace(pg_get_triggerdef(t.oid), '\s+', ' ', 'g')::text AS details
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND t.tgisinternal = false
)
SELECT section, schema_name, object_name, sub_object, details
FROM (
  SELECT * FROM table_rows
  UNION ALL
  SELECT * FROM column_rows
  UNION ALL
  SELECT * FROM constraint_rows
  UNION ALL
  SELECT * FROM index_rows
  UNION ALL
  SELECT * FROM trigger_rows
) all_rows
ORDER BY section, schema_name, object_name, sub_object, details;
