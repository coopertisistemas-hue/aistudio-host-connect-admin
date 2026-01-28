-- 003_add_perf_indexes.sql
-- Safety pre-checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'property_id'
  ) THEN
    RAISE EXCEPTION 'Missing column public.tasks.property_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Missing column public.tasks.status';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Missing column public.tasks.created_at';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Missing column public.notifications.user_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Missing column public.notifications.created_at';
  END IF;
END $$;

-- Indexes
-- If your migration runner uses a transaction, keep non-CONCURRENTLY.
-- For large tables, run these as CREATE INDEX CONCURRENTLY in a separate session.

CREATE INDEX IF NOT EXISTS idx_tasks_property_status
  ON public.tasks (property_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_property_created_at_desc
  ON public.tasks (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at_desc
  ON public.notifications (user_id, created_at DESC);

-- Optional: only if notifications.read_at exists
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read_at'
--   ) THEN
--     EXECUTE 'CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at ON public.notifications (user_id, read_at)';
--   END IF;
-- END $$;

-- Rollback (minimal, safe)
-- DROP INDEX IF EXISTS idx_tasks_property_status;
-- DROP INDEX IF EXISTS idx_tasks_property_created_at_desc;
-- DROP INDEX IF EXISTS idx_notifications_user_created_at_desc;
-- DROP INDEX IF EXISTS idx_notifications_user_read_at;
