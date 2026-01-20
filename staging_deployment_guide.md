# Supabase Staging Deployment Guide (No-Docker)

Follow these steps to link your local repository to a Supabase Staging project and execute migrations safely.

## 1. Authentication
Authorize the CLI to access your Supabase account.
```powershell
supabase login
```

## 2. Retrieve Project ID (Reference)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects).
2. Open your **Staging** project.
3. The Project ID (Reference) is the string in the URL: `https://supabase.com/dashboard/project/your-project-id`
4. Alternatively, go to **Project Settings > General** and copy the **Reference ID**.

## 3. Link Local Repository
Connect your local environment to the staging project.
```powershell
supabase link --project-ref <your-project-id>
```
> [!NOTE]
> This command will ask for your **Database Password**. You can find/reset this in Settings > Database.

## 4. Apply Migration (No-Docker Path)
Since Docker is unavailable, `supabase db push` cannot be used. Use one of these methods:

### Method A: Supabase SQL Editor (Recommended)
1. Copy the contents of `supabase/migrations/20260119_sprint2_guest_domain_model.sql`.
2. Paste into a new query in the **Supabase Dashboard SQL Editor**.
3. Run the query.

### Method B: PostgreSQL CLI (psql)
If you have `psql` installed, run this from the project root:
```powershell
psql "postgresql://postgres:<password>@db.<your-project-id>.supabase.co:5432/postgres" -f "supabase/migrations/20260119_sprint2_guest_domain_model.sql"
```

## 5. Run Validation
Execute the validation script to verify schema and multi-tenancy.

### Method A: SQL Editor
1. Copy contents of `sprint2_migration_validation.sql`.
2. Paste and Run in the **SQL Editor**.

### Method B: psql
```powershell
psql "postgresql://postgres:<password>@db.<your-project-id>.supabase.co:5432/postgres" -f "sprint2_migration_validation.sql"
```

---

## ⚠️ Rollback & Recovery Plan

### Option 1: Supabase Dashboard Snapshot (Safest)
1. Before applying migrations, go to **Database > Backups**.
2. Note the latest Daily Backup or trigger a manual snapshot if your plan allows.
3. To revert, use the **Restore** functionality in the dashboard.

### Option 2: SQL Revert
If you need to manually revert only the Sprint 2 changes, run this in the SQL Editor:
```sql
DROP TABLE IF EXISTS public.pre_checkin_sessions;
DROP TABLE IF EXISTS public.booking_guests;
DROP TABLE IF EXISTS public.guest_consents;
DROP TABLE IF EXISTS public.guests;
DROP FUNCTION IF EXISTS update_updated_at_column;
```
