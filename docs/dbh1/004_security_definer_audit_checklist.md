# SECURITY DEFINER Audit Checklist (DBH.1)

## Inventory (from docs/supa_dumps/schema.sql)
- net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer)
- net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
- pgbouncer.get_auth(p_usename text)
- public.accept_invite(p_token text)
- public.check_booking_access(target_booking_id uuid)
- public.check_user_access(target_property_id uuid)
- public.create_organization(org_name text)
- public.create_personal_org_for_user(p_user_id uuid)
- public.current_org_id()
- public.extend_trial(target_user_id uuid, reason text)
- public.get_user_role()
- public.handle_new_user()
- public.handle_new_user_org()
- public.handle_new_user_trial()
- public.is_hostconnect_staff()
- public.is_org_admin(p_org_id uuid)
- public.is_org_admin_no_rls(p_org_id uuid)
- public.is_org_member(p_org_id uuid)
- public.is_super_admin()
- public.log_profile_sensitive_changes()
- public.prevent_super_admin_self_promotion()
- storage.add_prefixes(_bucket_id text, _name text)
- storage.delete_leaf_prefixes(bucket_ids text[], names text[])
- storage.delete_prefix(_bucket_id text, _name text)
- storage.lock_top_prefixes(bucket_ids text[], names text[])
- storage.objects_delete_cleanup()
- storage.objects_update_cleanup()
- storage.prefixes_delete_cleanup()

## Checklist (apply to each function)
- auth.uid() checks enforce ownership or staff access where user context is required
- No PII or tenant identifiers returned unless explicitly permitted
- No privileged reads that bypass RLS without explicit justification
- search_path explicitly set to a safe schema and minimal required privileges
- No dynamic SQL that could be exploited by untrusted inputs
- Logs/audits do not leak secrets or cross-tenant data
- Least privilege grants on EXECUTE (avoid PUBLIC)

## DBH.1 Definition of Done
- RLS enabled + forced on `public.guests` and `public.guest_consents`
- Tenant-scoped policies validated for SELECT/INSERT/UPDATE/DELETE
- `public.profiles` SELECT restricted to self (plus super admin)
- Performance indexes created on tasks and notifications
- SECURITY DEFINER inventory audited with checklist findings documented
- SQL isolation tests executed (positive + negative paths)

## SQL Test Plan (Isolation)
Prereqs: Create two orgs (org_a, org_b) and two users (user_a, user_b).

### Guests
```sql
SET LOCAL role authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<user_a_uuid>","role":"authenticated"}', true);

INSERT INTO public.guests (org_id, first_name, last_name)
VALUES ('<org_a_uuid>', 'A', 'Guest');

SELECT * FROM public.guests WHERE org_id = '<org_a_uuid>';

SELECT * FROM public.guests WHERE org_id = '<org_b_uuid>'; -- expect 0 rows

INSERT INTO public.guests (org_id, first_name, last_name)
VALUES ('<org_b_uuid>', 'B', 'Guest'); -- expect RLS violation
```

### Guest Consents
```sql
INSERT INTO public.guest_consents (org_id, consent_type, accepted)
VALUES ('<org_a_uuid>', 'data_processing', true);

SELECT * FROM public.guest_consents WHERE org_id = '<org_a_uuid>';

SELECT * FROM public.guest_consents WHERE org_id = '<org_b_uuid>'; -- expect 0 rows
```

### Profiles
```sql
SELECT * FROM public.profiles WHERE id = '<user_a_uuid>'; -- allowed
SELECT * FROM public.profiles WHERE id = '<user_b_uuid>'; -- expect 0 rows
```

### Super Admin Access
```sql
SELECT * FROM public.profiles WHERE id = '<user_b_uuid>'; -- allowed
SELECT * FROM public.guests WHERE org_id = '<org_b_uuid>'; -- allowed
```
