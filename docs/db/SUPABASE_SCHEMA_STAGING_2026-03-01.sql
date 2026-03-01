--
-- PostgreSQL database dump
--

\restrict LFmf9ywLXgknIDR6hC5mWLhF7R6OWrFczAD4N5SBpXC8mLpX0VV02hhd8O4eLFp

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: accept_invite(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.accept_invite(p_token text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_invite public.org_invites%ROWTYPE;
  v_user_email text;
  v_user_id uuid;
BEGIN
  -- Get Invite
  SELECT * INTO v_invite
  FROM public.org_invites
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  -- Get Current User
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
     RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Verify Email? (Optional: Strict or Open Link)
  -- Prompt says: "admin cria e envia link". Usually implies link is key.
  -- But for security, matching email is better. 
  -- Let's enforce email match if invite prompt specifically asked for email.
  -- But user might have different email alias. 
  -- Let's be lenient for this "Simples" mvp: If they have the valid token, they claim it.
  -- BUT update the invite with the actual user who claimed it.

  -- Add to Org Members
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_invite.org_id, v_user_id, v_invite.role)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Update Invite Status
  UPDATE public.org_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN json_build_object('success', true, 'org_id', v_invite.org_id);
END;
$$;


--
-- Name: auto_set_accommodation_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_set_accommodation_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Only update if plan has changed or is being set for the first time
  IF (TG_OP = 'INSERT') OR (OLD.plan IS DISTINCT FROM NEW.plan) THEN
    -- Set accommodation_limit based on plan
    CASE NEW.plan
      WHEN 'founder' THEN NEW.accommodation_limit := 100;
      WHEN 'premium' THEN NEW.accommodation_limit := 100;
      WHEN 'pro' THEN NEW.accommodation_limit := 10;
      WHEN 'basic' THEN NEW.accommodation_limit := 2;
      ELSE NEW.accommodation_limit := 1; -- Free or unknown
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: calculate_movement_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_movement_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Busca o estoque atual do item
  SELECT current_stock INTO current_balance
  FROM stock_items
  WHERE id = NEW.stock_item_id;
  
  -- Define o saldo antes da movimentação
  NEW.balance_before := current_balance;
  
  -- Calcula o saldo depois da movimentação
  NEW.balance_after := current_balance + NEW.quantity;
  
  RETURN NEW;
END;
$$;


--
-- Name: check_accommodation_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_accommodation_limit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
  user_plan TEXT;
  user_plan_status TEXT;
  user_trial_expires_at TIMESTAMPTZ;
  is_trial_active BOOLEAN;
BEGIN
  -- Get the current number of properties for the user
  SELECT COUNT(*) INTO current_count
  FROM public.properties
  WHERE user_id = new.user_id; 
  -- Get the user's limit, plan, and trial info from profiles
  SELECT 
    accommodation_limit, 
    plan, 
    plan_status, 
    trial_expires_at 
  INTO 
    max_limit, 
    user_plan, 
    user_plan_status, 
    user_trial_expires_at
  FROM public.profiles
  WHERE id = new.user_id;
  -- Determine if trial is active
  IF user_plan_status = 'trial' AND user_trial_expires_at > NOW() THEN
    is_trial_active := TRUE;
  ELSE
    is_trial_active := FALSE;
  END IF;
  -- Default limit logic (Fallback + Trial Override)
  IF is_trial_active THEN
     -- If in trial, ensure at least 100 slots (Premium/Founder level)
     IF max_limit IS NULL OR max_limit < 100 THEN
        max_limit := 100;
        user_plan := 'trial (premium)'; -- Just for error message context
     END IF;
  ELSIF max_limit IS NULL THEN
    -- Fallback for non-trial users with NULL limits
    CASE user_plan
      WHEN 'founder' THEN max_limit := 100;
      WHEN 'premium' THEN max_limit := 100;
      WHEN 'pro' THEN max_limit := 10;
      WHEN 'basic' THEN max_limit := 2;
      ELSE max_limit := 1; -- Free or unknown
    END CASE;
  END IF;
  -- Check if adding 1 would exceed the limit
  IF (current_count + 1) > max_limit THEN
    RAISE EXCEPTION 'Limite de acomodações atingido para o plano %. Atual: %, Limite: %', user_plan, current_count, max_limit
      USING ERRCODE = 'P0001'; 
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: check_booking_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_booking_access(target_booking_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: check_user_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_access(target_property_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: create_organization(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_organization(org_name text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    new_org_id uuid;
BEGIN
    -- 1. Create Org
    INSERT INTO public.organizations (name, owner_id)
    VALUES (org_name, auth.uid())
    RETURNING id INTO new_org_id;

    -- 2. Add Creator as Owner
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (new_org_id, auth.uid(), 'owner');

    RETURN json_build_object('id', new_org_id, 'name', org_name);
END;
$$;


--
-- Name: create_personal_org_for_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_personal_org_for_user(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_org_id uuid;
    v_user_name text;
BEGIN
    -- Idempotency Check: If user is already a member of ANY organization, skip.
    -- (We assume if they are a member, they are 'set up'. If we wanted to force a PERSONAL org specifically, logic would differ).
    IF EXISTS (SELECT 1 FROM public.org_members WHERE user_id = p_user_id) THEN
        RETURN;
    END IF;

    -- Get user name for better org name (optional, fallback to generic)
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
    IF v_user_name IS NULL OR v_user_name = '' THEN
        v_user_name := 'Minha Hospedagem';
    ELSE
        v_user_name := v_user_name || ' - Hospedagem';
    END IF;

    -- Create Org
    INSERT INTO public.organizations (name, owner_id)
    VALUES (v_user_name, p_user_id)
    RETURNING id INTO v_org_id;

    -- Add User as Owner
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    
EXCEPTION WHEN OTHERS THEN
    -- Log error or ignore to prevent blocking user creation
    RAISE WARNING 'Failed to create personal org for user %: %', p_user_id, SQLERRM;
END;
$$;


--
-- Name: current_org_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_org_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT org_id INTO v_org_id
    FROM public.org_members
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC -- Stable ordering (oldest membership)
    LIMIT 1;
    
    RETURN v_org_id;
END;
$$;


--
-- Name: extend_trial(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extend_trial(target_user_id uuid, reason text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    target_profile record;
    old_expiration timestamptz;
BEGIN
    -- Check Permissions
    IF NOT public.is_hostconnect_staff() THEN
        RAISE EXCEPTION 'Access Denied: Only staff can extend trials.';
    END IF;

    SELECT * INTO target_profile FROM public.profiles WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found.';
    END IF;

    -- Validate
    IF target_profile.plan_status != 'trial' THEN
         RAISE EXCEPTION 'Cannot extend trial: User is not currently in active trial (Status: %)', target_profile.plan_status;
    END IF;

    IF target_profile.trial_extension_days > 0 THEN
        RAISE EXCEPTION 'Cannot extend trial: Trial has already been extended once.';
    END IF;
    
    old_expiration := target_profile.trial_expires_at;

    -- Update
    UPDATE public.profiles
    SET 
        trial_extended_at = now(),
        trial_extension_days = 15,
        trial_extension_reason = reason,
        trial_expires_at = trial_expires_at + interval '15 days'
    WHERE id = target_user_id;

    -- Explicit Audit Log for Action Context (The trigger will also catch the data change)
    INSERT INTO public.audit_log (
        actor_user_id,
        target_user_id,
        action,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        target_user_id,
        'TRIAL_EXTENSION_RPC',
        jsonb_build_object('reason', reason, 'old_expires_at', old_expiration),
        jsonb_build_object('extension_days', 15, 'new_expires_at', old_expiration + interval '15 days')
    );

    RETURN json_build_object(
        'success', true, 
        'message', 'Trial extended by 15 days.',
        'new_expires_at', (target_profile.trial_expires_at + interval '15 days')
    );
END;
$$;


--
-- Name: get_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  DECLARE
    user_role text;
  BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role;
  END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  selected_plan TEXT;
BEGIN
  -- Extract plan from user metadata (sent from frontend during signup)
  selected_plan := NEW.raw_user_meta_data->>'plan';
  
  -- Default to 'basic' if no plan specified
  IF selected_plan IS NULL OR selected_plan = '' THEN
    selected_plan := 'basic';
  END IF;
  -- Insert profile with plan
  INSERT INTO public.profiles (id, full_name, email, phone, plan)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    selected_plan
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_org(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_org() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    PERFORM public.create_personal_org_for_user(NEW.id);
    RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_trial(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_trial() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Only initialize trial if plan is empty or free (default assumption for new signups)
    IF (NEW.plan IS NULL OR NEW.plan = 'free' OR NEW.plan = '') THEN
        NEW.plan_status := 'trial';
        NEW.trial_started_at := now();
        NEW.trial_expires_at := now() + interval '15 days';
        -- Optional: Set plan to 'premium' or similar if trial gives access to everything?
        -- User requirements didn't specify changing the 'plan' column itself, only setting 'plan_status'='trial'.
        -- We will assume Entitlements Logic will handle (plan='free' AND plan_status='trial') -> Give Premium Access.
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: is_hostconnect_staff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_hostconnect_staff() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- HostConnect staff members are super admins
  -- This is an alias for consistency with existing policies
  RETURN public.is_super_admin();
END;
$$;


--
-- Name: FUNCTION is_hostconnect_staff(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_hostconnect_staff() IS 'Returns true if current user is a HostConnect staff member (super admin). 
Used in RLS policies for cross-organizational support access.';


--
-- Name: is_org_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_admin(p_org_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_id = p_org_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$;


--
-- Name: is_org_admin_no_rls(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_admin_no_rls(p_org_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    SET row_security TO 'off'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$;


--
-- Name: is_org_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_member(p_org_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_id = p_org_id 
    AND user_id = auth.uid()
  );
END;
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$;


--
-- Name: FUNCTION is_super_admin(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if current user is a super admin (Connect team member)';


--
-- Name: log_profile_sensitive_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_profile_sensitive_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    current_actor uuid;
    changes_detected boolean := false;
    old_snapshot jsonb;
    new_snapshot jsonb;
BEGIN
    -- Attempt to get actor from auth.uid()
    current_actor := auth.uid();

    -- Check for sensitive columns changes
    IF (OLD.plan IS DISTINCT FROM NEW.plan) OR 
       (OLD.plan_status IS DISTINCT FROM NEW.plan_status) OR
       (OLD.trial_expires_at IS DISTINCT FROM NEW.trial_expires_at) OR 
       (OLD.trial_extension_days IS DISTINCT FROM NEW.trial_extension_days) THEN
       
       changes_detected := true;
    END IF;

    IF changes_detected THEN
        -- Construct snapshots of relevant fields only
        old_snapshot := jsonb_build_object(
            'plan', OLD.plan,
            'plan_status', OLD.plan_status,
            'trial_expires_at', OLD.trial_expires_at,
            'trial_extension_days', OLD.trial_extension_days
        );
        new_snapshot := jsonb_build_object(
            'plan', NEW.plan,
            'plan_status', NEW.plan_status,
            'trial_expires_at', NEW.trial_expires_at,
            'trial_extension_days', NEW.trial_extension_days
        );

        INSERT INTO public.audit_log (
            actor_user_id,
            target_user_id,
            action,
            old_data,
            new_data
        ) VALUES (
            current_actor,
            NEW.id,
            'PROFILE_SENSITIVE_UPDATE',
            old_snapshot,
            new_snapshot
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: moddatetime(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.moddatetime() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: prevent_super_admin_self_promotion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_super_admin_self_promotion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Only allow if current user is already a super admin
  -- This prevents regular users from promoting themselves
  IF NEW.is_super_admin = true AND OLD.is_super_admin = false THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Only super admins can promote users to super admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: set_org_id_from_inventory_item(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_org_id_from_inventory_item() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: set_org_id_from_property(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_org_id_from_property() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: set_org_id_from_room_type(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_org_id_from_room_type() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_stock_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_stock_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Atualiza o estoque atual do item
  UPDATE stock_items
  SET 
    current_stock = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.stock_item_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amenities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    org_id uuid NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    actor_user_id uuid,
    target_user_id uuid,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb
);


--
-- Name: booking_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text DEFAULT 'minibar'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: booking_guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    booking_id uuid,
    guest_id uuid,
    is_head boolean DEFAULT false,
    relationship text,
    created_at timestamp with time zone DEFAULT now(),
    full_name text DEFAULT 'Hóspede'::text NOT NULL,
    document text,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: booking_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    property_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    room_id uuid NOT NULL,
    is_primary boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE booking_rooms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.booking_rooms IS 'Links bookings to rooms (Sprint 4.5)';


--
-- Name: COLUMN booking_rooms.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.booking_rooms.is_primary IS 'Indicates the main room assigned to this booking';


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    guest_name text NOT NULL,
    guest_email text NOT NULL,
    guest_phone text,
    check_in date NOT NULL,
    check_out date NOT NULL,
    total_guests integer DEFAULT 1 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    room_type_id uuid,
    services_json jsonb DEFAULT '[]'::jsonb,
    current_room_id uuid,
    lead_id uuid,
    org_id uuid NOT NULL,
    stripe_session_id text,
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['INQUIRY'::text, 'QUOTED'::text, 'CONFIRMED'::text, 'CHECKED_IN'::text, 'CHECKED_OUT'::text, 'CANCELLED'::text, 'NO_SHOW'::text])))
);


--
-- Name: COLUMN bookings.services_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bookings.services_json IS 'JSON array of service IDs associated with the booking.';


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: entity_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_photos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photo_url text NOT NULL,
    is_primary boolean DEFAULT false,
    display_order integer DEFAULT 0
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    expense_date date NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_status text DEFAULT 'pending'::text NOT NULL,
    paid_date date
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: guest_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    guest_id uuid,
    consent_type text,
    accepted boolean DEFAULT false NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    type text DEFAULT 'data_processing'::text NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    source text DEFAULT 'system'::text NOT NULL,
    captured_by uuid
);

ALTER TABLE ONLY public.guest_consents FORCE ROW LEVEL SECURITY;


--
-- Name: guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    document_id text,
    document_type text,
    birth_date date,
    gender text,
    address_json jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    document text,
    birthdate date,
    notes text,
    first_name text NOT NULL,
    last_name text NOT NULL
);

ALTER TABLE ONLY public.guests FORCE ROW LEVEL SECURITY;


--
-- Name: hostconnect_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hostconnect_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    property_id uuid,
    mode text,
    last_step integer DEFAULT 1 NOT NULL,
    completed_at timestamp with time zone,
    dismissed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT hostconnect_onboarding_mode_check CHECK ((mode = ANY (ARRAY['simple'::text, 'standard'::text, 'hotel'::text])))
);


--
-- Name: hostconnect_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hostconnect_staff (
    user_id uuid NOT NULL,
    role text DEFAULT 'support'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: how_it_works_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.how_it_works_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    step_number integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: idea_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idea_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    idea_id uuid NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    content text NOT NULL,
    is_staff_reply boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ideas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ideas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'under_review'::text NOT NULL,
    votes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    is_visible boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid,
    name text NOT NULL,
    category text DEFAULT 'Geral'::text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    price numeric(10,2) DEFAULT 0.00,
    is_for_sale boolean DEFAULT false
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    property_id uuid NOT NULL,
    issue_date timestamp with time zone DEFAULT now(),
    due_date timestamp with time zone,
    total_amount numeric NOT NULL,
    paid_amount numeric DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_intent_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'CLOSED'::text, 'REFUNDED'::text])))
);


--
-- Name: item_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid,
    location text DEFAULT 'pantry'::text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    last_updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    org_id uuid NOT NULL
);


--
-- Name: lead_timeline_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_timeline_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: member_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    module_key text NOT NULL,
    can_read boolean DEFAULT true,
    can_write boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: org_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval)
);


--
-- Name: org_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text, 'viewer'::text])))
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    owner_id uuid
);


--
-- Name: pre_checkin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_checkin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    booking_id uuid,
    token_hash text,
    expires_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    token text NOT NULL
);


--
-- Name: pre_checkin_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_checkin_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    session_id uuid NOT NULL,
    status text DEFAULT 'submitted'::text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pre_checkin_submissions_status_check CHECK ((status = ANY (ARRAY['submitted'::text, 'applied'::text, 'rejected'::text])))
);


--
-- Name: TABLE pre_checkin_submissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pre_checkin_submissions IS 'Stores guest-submitted pre-check-in data pending admin review and application to bookings. Scoped by org_id for multi-tenant isolation.';


--
-- Name: COLUMN pre_checkin_submissions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pre_checkin_submissions.status IS 'Workflow status: submitted (pending review), applied (added to booking), rejected (declined by admin)';


--
-- Name: COLUMN pre_checkin_submissions.payload; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pre_checkin_submissions.payload IS 'JSONB containing participant data: {full_name, document?, email?, phone?, birthdate?}';


--
-- Name: precheckin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.precheckin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    org_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT precheckin_sessions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'incomplete'::text, 'complete'::text])))
);


--
-- Name: pricing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    commission numeric NOT NULL,
    period text NOT NULL,
    description text,
    is_popular boolean DEFAULT false,
    display_order integer DEFAULT 0,
    features jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    property_id uuid NOT NULL,
    room_type_id uuid,
    start_date date NOT NULL,
    end_date date NOT NULL,
    base_price_override numeric(10,2),
    price_modifier numeric(5,2),
    min_stay integer DEFAULT 1,
    max_stay integer,
    promotion_name text,
    status text DEFAULT 'active'::text NOT NULL,
    org_id uuid NOT NULL,
    CONSTRAINT pricing_rules_check_dates CHECK ((end_date >= start_date)),
    CONSTRAINT pricing_rules_check_price_or_modifier CHECK (((base_price_override IS NOT NULL) OR (price_modifier IS NOT NULL)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text DEFAULT 'user'::text NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    accommodation_limit integer DEFAULT 0,
    founder_started_at timestamp with time zone,
    founder_expires_at timestamp with time zone,
    entitlements jsonb,
    onboarding_completed boolean DEFAULT false,
    onboarding_step integer DEFAULT 1,
    onboarding_type text,
    trial_started_at timestamp with time zone,
    trial_expires_at timestamp with time zone,
    trial_extended_at timestamp with time zone,
    trial_extension_days integer DEFAULT 0 NOT NULL,
    trial_extension_reason text,
    plan_status text DEFAULT 'active'::text NOT NULL,
    is_super_admin boolean DEFAULT false
);

ALTER TABLE ONLY public.profiles FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN profiles.is_super_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.is_super_admin IS 'Connect team members with cross-organizational access for support. Only set via direct SQL.';


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text DEFAULT 'Brasil'::text NOT NULL,
    postal_code text,
    phone text,
    email text,
    total_rooms integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    org_id uuid NOT NULL,
    neighborhood text,
    number text,
    no_number boolean DEFAULT false,
    whatsapp text
);


--
-- Name: reservation_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservation_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    channel text,
    status text DEFAULT 'new'::text NOT NULL,
    guest_name text NOT NULL,
    guest_phone text,
    guest_email text,
    check_in_date date,
    check_out_date date,
    adults integer DEFAULT 1,
    children integer DEFAULT 0,
    notes text,
    assigned_to uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT reservation_leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'quoted'::text, 'negotiation'::text, 'won'::text, 'lost'::text])))
);


--
-- Name: reservation_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservation_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    property_id uuid NOT NULL,
    currency text DEFAULT 'BRL'::text,
    subtotal numeric(10,2) NOT NULL,
    fees numeric(10,2) DEFAULT 0,
    taxes numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    policy_text text,
    expires_at timestamp with time zone,
    sent_at timestamp with time zone,
    status text DEFAULT 'draft'::text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT reservation_quotes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: room_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    property_id uuid NOT NULL,
    org_id uuid NOT NULL
);


--
-- Name: room_type_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_type_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_type_id uuid,
    item_id uuid,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL,
    CONSTRAINT room_type_inventory_quantity_check CHECK ((quantity > 0))
);


--
-- Name: room_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_types (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    capacity integer DEFAULT 1 NOT NULL,
    base_price numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    amenities_json text[],
    category text DEFAULT 'standard'::text,
    abbreviation text,
    occupation_label text,
    occupation_abbr text,
    org_id uuid NOT NULL
);


--
-- Name: COLUMN room_types.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.room_types.category IS 'Room category/standard: standard, superior, deluxe, luxury, suite';


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    room_type_id uuid NOT NULL,
    room_number text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_booking_id uuid,
    org_id uuid NOT NULL,
    updated_by uuid,
    CONSTRAINT rooms_status_check CHECK ((status = ANY (ARRAY['available'::text, 'occupied'::text, 'maintenance'::text, 'dirty'::text, 'cleaning'::text, 'clean'::text, 'inspected'::text, 'out_of_order'::text])))
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    is_per_person boolean DEFAULT false NOT NULL,
    is_per_day boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid NOT NULL,
    CONSTRAINT services_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: shift_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    role_on_shift text,
    status text DEFAULT 'assigned'::text,
    check_in_at timestamp with time zone,
    check_out_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT shift_assignments_status_check CHECK ((status = ANY (ARRAY['assigned'::text, 'confirmed'::text, 'absent'::text])))
);


--
-- Name: shift_handoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_handoffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_id uuid NOT NULL,
    text text NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    department_id uuid,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    status text DEFAULT 'planned'::text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT shifts_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])))
);


--
-- Name: staff_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    user_id uuid,
    name text NOT NULL,
    phone text,
    role text NOT NULL,
    departments jsonb DEFAULT '[]'::jsonb,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: stock_check_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_check_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    daily_check_id uuid NOT NULL,
    stock_item_id uuid NOT NULL,
    expected_quantity numeric(10,2) NOT NULL,
    counted_quantity numeric(10,2),
    divergence numeric(10,2) GENERATED ALWAYS AS ((counted_quantity - expected_quantity)) STORED,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_daily_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_daily_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    check_date date NOT NULL,
    checked_by uuid,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_items integer DEFAULT 0,
    items_with_divergence integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: stock_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    location_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    unit character varying(50) DEFAULT 'unidade'::character varying,
    minimum_stock numeric(10,2) DEFAULT 0,
    current_stock numeric(10,2) DEFAULT 0,
    cost_price numeric(10,2),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stock_item_id uuid NOT NULL,
    movement_type character varying(50) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    balance_before numeric(10,2) NOT NULL,
    balance_after numeric(10,2) NOT NULL,
    user_id uuid,
    reference_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    due_date date,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    role text,
    content text NOT NULL,
    location text,
    rating integer DEFAULT 5,
    is_visible boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    content text NOT NULL,
    is_staff_reply boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    severity text DEFAULT 'low'::text NOT NULL,
    category text DEFAULT 'general'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL
);


--
-- Name: website_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.website_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: booking_charges booking_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_charges
    ADD CONSTRAINT booking_charges_pkey PRIMARY KEY (id);


--
-- Name: booking_guests booking_guests_booking_id_guest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guests
    ADD CONSTRAINT booking_guests_booking_id_guest_id_key UNIQUE (booking_id, guest_id);


--
-- Name: booking_guests booking_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guests
    ADD CONSTRAINT booking_guests_pkey PRIMARY KEY (id);


--
-- Name: booking_rooms booking_rooms_org_booking_room_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_org_booking_room_unique UNIQUE (org_id, booking_id, room_id);


--
-- Name: booking_rooms booking_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: entity_photos entity_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_photos
    ADD CONSTRAINT entity_photos_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: guest_consents guest_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_consents
    ADD CONSTRAINT guest_consents_pkey PRIMARY KEY (id);


--
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- Name: hostconnect_onboarding hostconnect_onboarding_org_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_onboarding
    ADD CONSTRAINT hostconnect_onboarding_org_id_key UNIQUE (org_id);


--
-- Name: hostconnect_onboarding hostconnect_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_onboarding
    ADD CONSTRAINT hostconnect_onboarding_pkey PRIMARY KEY (id);


--
-- Name: hostconnect_staff hostconnect_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_staff
    ADD CONSTRAINT hostconnect_staff_pkey PRIMARY KEY (user_id);


--
-- Name: how_it_works_steps how_it_works_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.how_it_works_steps
    ADD CONSTRAINT how_it_works_steps_pkey PRIMARY KEY (id);


--
-- Name: how_it_works_steps how_it_works_steps_step_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.how_it_works_steps
    ADD CONSTRAINT how_it_works_steps_step_number_key UNIQUE (step_number);


--
-- Name: idea_comments idea_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_comments
    ADD CONSTRAINT idea_comments_pkey PRIMARY KEY (id);


--
-- Name: ideas ideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: item_stock item_stock_item_id_location_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_stock
    ADD CONSTRAINT item_stock_item_id_location_key UNIQUE (item_id, location);


--
-- Name: item_stock item_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_stock
    ADD CONSTRAINT item_stock_pkey PRIMARY KEY (id);


--
-- Name: lead_timeline_events lead_timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline_events
    ADD CONSTRAINT lead_timeline_events_pkey PRIMARY KEY (id);


--
-- Name: member_permissions member_permissions_org_id_user_id_module_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_permissions
    ADD CONSTRAINT member_permissions_org_id_user_id_module_key_key UNIQUE (org_id, user_id, module_key);


--
-- Name: member_permissions member_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_permissions
    ADD CONSTRAINT member_permissions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: org_invites org_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invites
    ADD CONSTRAINT org_invites_pkey PRIMARY KEY (id);


--
-- Name: org_members org_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- Name: org_members org_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: pre_checkin_sessions pre_checkin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_sessions
    ADD CONSTRAINT pre_checkin_sessions_pkey PRIMARY KEY (id);


--
-- Name: pre_checkin_sessions pre_checkin_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_sessions
    ADD CONSTRAINT pre_checkin_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: pre_checkin_sessions pre_checkin_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_sessions
    ADD CONSTRAINT pre_checkin_sessions_token_key UNIQUE (token);


--
-- Name: pre_checkin_submissions pre_checkin_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_submissions
    ADD CONSTRAINT pre_checkin_submissions_pkey PRIMARY KEY (id);


--
-- Name: precheckin_sessions precheckin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.precheckin_sessions
    ADD CONSTRAINT precheckin_sessions_pkey PRIMARY KEY (id);


--
-- Name: pricing_plans pricing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_plans
    ADD CONSTRAINT pricing_plans_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: reservation_leads reservation_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_leads
    ADD CONSTRAINT reservation_leads_pkey PRIMARY KEY (id);


--
-- Name: reservation_quotes reservation_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_quotes
    ADD CONSTRAINT reservation_quotes_pkey PRIMARY KEY (id);


--
-- Name: room_categories room_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_pkey PRIMARY KEY (id);


--
-- Name: room_categories room_categories_property_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_property_slug_key UNIQUE (property_id, slug);


--
-- Name: room_type_inventory room_type_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_type_inventory
    ADD CONSTRAINT room_type_inventory_pkey PRIMARY KEY (id);


--
-- Name: room_type_inventory room_type_inventory_room_type_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_type_inventory
    ADD CONSTRAINT room_type_inventory_room_type_id_item_id_key UNIQUE (room_type_id, item_id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_room_number_property_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_number_property_id_key UNIQUE (room_number, property_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: shift_assignments shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: shift_handoffs shift_handoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_handoffs
    ADD CONSTRAINT shift_handoffs_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: staff_profiles staff_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_pkey PRIMARY KEY (id);


--
-- Name: stock_check_items stock_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_check_items
    ADD CONSTRAINT stock_check_items_pkey PRIMARY KEY (id);


--
-- Name: stock_daily_checks stock_daily_checks_location_id_check_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_daily_checks
    ADD CONSTRAINT stock_daily_checks_location_id_check_date_key UNIQUE (location_id, check_date);


--
-- Name: stock_daily_checks stock_daily_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_daily_checks
    ADD CONSTRAINT stock_daily_checks_pkey PRIMARY KEY (id);


--
-- Name: stock_items stock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_pkey PRIMARY KEY (id);


--
-- Name: stock_locations stock_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_locations
    ADD CONSTRAINT stock_locations_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: website_settings unique_property_setting; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_settings
    ADD CONSTRAINT unique_property_setting UNIQUE (property_id, setting_key);


--
-- Name: website_settings website_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_settings
    ADD CONSTRAINT website_settings_pkey PRIMARY KEY (id);


--
-- Name: website_settings website_settings_property_id_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_settings
    ADD CONSTRAINT website_settings_property_id_setting_key_key UNIQUE (property_id, setting_key);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: bookings_room_type_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_room_type_id_idx ON public.bookings USING btree (room_type_id);


--
-- Name: bookings_stripe_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_stripe_session_id_idx ON public.bookings USING btree (stripe_session_id);


--
-- Name: idx_amenities_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amenities_org_id ON public.amenities USING btree (org_id);


--
-- Name: idx_audit_log_actor_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_actor_user_id ON public.audit_log USING btree (actor_user_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC);


--
-- Name: INDEX idx_audit_log_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_audit_log_created_at IS 'Performance: Audit log typically queried by recent date';


--
-- Name: idx_audit_log_target_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_target_user_id ON public.audit_log USING btree (target_user_id);


--
-- Name: idx_booking_charges_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_charges_booking_id ON public.booking_charges USING btree (booking_id);


--
-- Name: INDEX idx_booking_charges_booking_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_booking_charges_booking_id IS 'Performance: Folio items query';


--
-- Name: idx_booking_guests_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_booking ON public.booking_guests USING btree (booking_id);


--
-- Name: idx_booking_guests_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_booking_id ON public.booking_guests USING btree (booking_id);


--
-- Name: INDEX idx_booking_guests_booking_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_booking_guests_booking_id IS 'Performance: Check-in and participant queries';


--
-- Name: idx_booking_guests_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_guest_id ON public.booking_guests USING btree (guest_id);


--
-- Name: idx_booking_guests_is_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_is_primary ON public.booking_guests USING btree (is_primary);


--
-- Name: idx_booking_guests_org_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_org_booking ON public.booking_guests USING btree (org_id, booking_id);


--
-- Name: idx_booking_guests_org_guest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_org_guest ON public.booking_guests USING btree (org_id, guest_id);


--
-- Name: idx_booking_guests_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_guests_org_id ON public.booking_guests USING btree (org_id);


--
-- Name: idx_booking_rooms_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_booking_id ON public.booking_rooms USING btree (booking_id);


--
-- Name: INDEX idx_booking_rooms_booking_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_booking_rooms_booking_id IS 'Performance: Folio page joins bookings with rooms';


--
-- Name: idx_booking_rooms_composite_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_composite_booking ON public.booking_rooms USING btree (org_id, property_id, booking_id);


--
-- Name: idx_booking_rooms_composite_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_composite_room ON public.booking_rooms USING btree (org_id, property_id, room_id);


--
-- Name: idx_booking_rooms_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_org_id ON public.booking_rooms USING btree (org_id);


--
-- Name: idx_booking_rooms_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_primary ON public.booking_rooms USING btree (org_id, property_id, booking_id, is_primary);


--
-- Name: idx_booking_rooms_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_property_id ON public.booking_rooms USING btree (property_id);


--
-- Name: idx_booking_rooms_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_rooms_room_id ON public.booking_rooms USING btree (room_id);


--
-- Name: idx_bookings_check_in; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_check_in ON public.bookings USING btree (check_in);


--
-- Name: idx_bookings_check_out; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_check_out ON public.bookings USING btree (check_out);


--
-- Name: idx_bookings_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_dates ON public.bookings USING btree (check_in, check_out);


--
-- Name: INDEX idx_bookings_dates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_bookings_dates IS 'Performance: Arrivals/Departures queries filter by check-in/check-out dates';


--
-- Name: idx_bookings_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_org_id ON public.bookings USING btree (org_id);


--
-- Name: idx_bookings_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_org_status ON public.bookings USING btree (org_id, status);


--
-- Name: INDEX idx_bookings_org_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_bookings_org_status IS 'Performance: Dashboard queries filter by org_id and status';


--
-- Name: idx_bookings_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_property_id ON public.bookings USING btree (property_id);


--
-- Name: idx_daily_checks_location_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_checks_location_date ON public.stock_daily_checks USING btree (location_id, check_date);


--
-- Name: idx_guest_consents_org_guest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_consents_org_guest ON public.guest_consents USING btree (org_id, guest_id);


--
-- Name: idx_guest_consents_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_consents_org_id ON public.guest_consents USING btree (org_id);


--
-- Name: idx_guest_consents_org_type_granted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_consents_org_type_granted ON public.guest_consents USING btree (org_id, type, granted);


--
-- Name: idx_guests_document; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_document ON public.guests USING btree (document);


--
-- Name: INDEX idx_guests_document; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_guests_document IS 'Performance: Guest lookup by document during check-in';


--
-- Name: idx_guests_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_email ON public.guests USING btree (email);


--
-- Name: INDEX idx_guests_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_guests_email IS 'Performance: Guest lookup by email during booking creation';


--
-- Name: idx_guests_org_document; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_org_document ON public.guests USING btree (org_id, document);


--
-- Name: idx_guests_org_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_org_email ON public.guests USING btree (org_id, email);


--
-- Name: idx_guests_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_org_id ON public.guests USING btree (org_id);


--
-- Name: idx_hostconnect_onboarding_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hostconnect_onboarding_completed ON public.hostconnect_onboarding USING btree (org_id, completed_at);


--
-- Name: idx_hostconnect_onboarding_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hostconnect_onboarding_org_id ON public.hostconnect_onboarding USING btree (org_id);


--
-- Name: idx_hostconnect_onboarding_org_property; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hostconnect_onboarding_org_property ON public.hostconnect_onboarding USING btree (org_id, property_id);


--
-- Name: idx_idea_comments_idea_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_idea_comments_idea_id ON public.idea_comments USING btree (idea_id);


--
-- Name: idx_ideas_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_org_id ON public.ideas USING btree (org_id);


--
-- Name: idx_ideas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_status ON public.ideas USING btree (status);


--
-- Name: idx_ideas_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ideas_user_id ON public.ideas USING btree (user_id);


--
-- Name: idx_inventory_items_for_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_items_for_sale ON public.inventory_items USING btree (is_for_sale) WHERE (is_for_sale = true);


--
-- Name: idx_item_stock_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_stock_org_id ON public.item_stock USING btree (org_id);


--
-- Name: idx_notifications_user_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created_at_desc ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_org_members_org_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_org_role ON public.org_members USING btree (org_id, role);


--
-- Name: idx_org_members_user_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_user_org ON public.org_members USING btree (user_id, org_id);


--
-- Name: INDEX idx_org_members_user_org; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_org_members_user_org IS 'Performance: Speeds up is_org_member() and is_org_admin() functions';


--
-- Name: idx_pre_checkin_sessions_org_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_sessions_org_booking ON public.pre_checkin_sessions USING btree (org_id, booking_id);


--
-- Name: idx_pre_checkin_sessions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_sessions_org_id ON public.pre_checkin_sessions USING btree (org_id);


--
-- Name: idx_pre_checkin_sessions_org_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_sessions_org_token ON public.pre_checkin_sessions USING btree (org_id, token);


--
-- Name: idx_pre_checkin_submissions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_submissions_org_id ON public.pre_checkin_submissions USING btree (org_id);


--
-- Name: idx_pre_checkin_submissions_org_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_submissions_org_session ON public.pre_checkin_submissions USING btree (org_id, session_id);


--
-- Name: idx_pre_checkin_submissions_org_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_checkin_submissions_org_status ON public.pre_checkin_submissions USING btree (org_id, status);


--
-- Name: idx_precheckin_sessions_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_precheckin_sessions_booking_id ON public.precheckin_sessions USING btree (booking_id);


--
-- Name: idx_precheckin_sessions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_precheckin_sessions_org_id ON public.precheckin_sessions USING btree (org_id);


--
-- Name: idx_precheckin_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_precheckin_sessions_status ON public.precheckin_sessions USING btree (status);


--
-- Name: idx_pricing_rules_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pricing_rules_org_id ON public.pricing_rules USING btree (org_id);


--
-- Name: idx_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_id ON public.profiles USING btree (id);


--
-- Name: idx_profiles_onboarding_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_onboarding_completed ON public.profiles USING btree (onboarding_completed);


--
-- Name: idx_profiles_super_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_super_admin ON public.profiles USING btree (is_super_admin) WHERE (is_super_admin = true);


--
-- Name: idx_properties_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_org_id ON public.properties USING btree (org_id);


--
-- Name: INDEX idx_properties_org_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_properties_org_id IS 'Performance: Multi-tenant isolation on properties';


--
-- Name: idx_properties_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_user_id ON public.properties USING btree (user_id);


--
-- Name: idx_room_categories_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_categories_org_id ON public.room_categories USING btree (org_id);


--
-- Name: idx_room_categories_property; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_categories_property ON public.room_categories USING btree (property_id);


--
-- Name: idx_room_type_inventory_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_type_inventory_org_id ON public.room_type_inventory USING btree (org_id);


--
-- Name: idx_room_types_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_types_org_id ON public.room_types USING btree (org_id);


--
-- Name: idx_rooms_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_org_id ON public.rooms USING btree (org_id);


--
-- Name: idx_rooms_org_property_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_org_property_status ON public.rooms USING btree (org_id, property_id, status);


--
-- Name: idx_rooms_org_property_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_org_property_updated ON public.rooms USING btree (org_id, property_id, updated_at DESC);


--
-- Name: idx_rooms_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_property_id ON public.rooms USING btree (property_id);


--
-- Name: idx_rooms_property_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_property_status ON public.rooms USING btree (property_id, status);


--
-- Name: INDEX idx_rooms_property_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_rooms_property_status IS 'Performance: Housekeeping page filters rooms by property and status';


--
-- Name: idx_services_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_org_id ON public.services USING btree (org_id);


--
-- Name: idx_stock_items_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_items_active ON public.stock_items USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_stock_items_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_items_location ON public.stock_items USING btree (location_id);


--
-- Name: idx_stock_items_property; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_items_property ON public.stock_items USING btree (property_id);


--
-- Name: idx_stock_movements_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_date ON public.stock_movements USING btree (reference_date);


--
-- Name: idx_stock_movements_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_item ON public.stock_movements USING btree (stock_item_id);


--
-- Name: idx_tasks_property_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_property_created_at_desc ON public.tasks USING btree (property_id, created_at DESC);


--
-- Name: idx_tasks_property_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_property_status ON public.tasks USING btree (property_id, status);


--
-- Name: idx_ticket_comments_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments USING btree (ticket_id);


--
-- Name: idx_tickets_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_org_id ON public.tickets USING btree (org_id);


--
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status);


--
-- Name: idx_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_user_id ON public.tickets USING btree (user_id);


--
-- Name: idx_website_settings_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_website_settings_org_id ON public.website_settings USING btree (org_id);


--
-- Name: services_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX services_property_id_idx ON public.services USING btree (property_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: properties enforce_accommodation_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_accommodation_limit BEFORE INSERT ON public.properties FOR EACH ROW EXECUTE FUNCTION public.check_accommodation_limit();


--
-- Name: booking_rooms handle_booking_rooms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_booking_rooms_updated_at BEFORE UPDATE ON public.booking_rooms FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: expenses handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: faqs handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: features handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.features FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: hostconnect_onboarding handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.hostconnect_onboarding FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: how_it_works_steps handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.how_it_works_steps FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: integrations handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: invoices handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: pricing_plans handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: pricing_rules handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: rooms handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: services handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: tasks handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: testimonials handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.moddatetime();


--
-- Name: website_settings handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');


--
-- Name: profiles set_accommodation_limit_on_plan_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_accommodation_limit_on_plan_change BEFORE INSERT OR UPDATE OF plan ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.auto_set_accommodation_limit();


--
-- Name: pre_checkin_submissions set_pre_checkin_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pre_checkin_submissions_updated_at BEFORE UPDATE ON public.pre_checkin_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles tr_audit_profile_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_profile_changes AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_profile_sensitive_changes();


--
-- Name: bookings tr_bookings_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_bookings_set_org BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: profiles tr_ensure_personal_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_ensure_personal_org AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_org();


--
-- Name: profiles tr_initialize_trial; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_initialize_trial BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trial();


--
-- Name: item_stock tr_item_stock_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_item_stock_set_org BEFORE INSERT ON public.item_stock FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_inventory_item();


--
-- Name: pricing_rules tr_pricing_rules_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_pricing_rules_set_org BEFORE INSERT ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: room_type_inventory tr_room_type_inventory_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_room_type_inventory_set_org BEFORE INSERT ON public.room_type_inventory FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_room_type();


--
-- Name: room_types tr_room_types_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_room_types_set_org BEFORE INSERT ON public.room_types FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: rooms tr_rooms_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_rooms_set_org BEFORE INSERT ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: services tr_services_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_services_set_org BEFORE INSERT ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: website_settings tr_website_settings_set_org; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_website_settings_set_org BEFORE INSERT ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property();


--
-- Name: stock_movements trg_calculate_balance_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_calculate_balance_before_insert BEFORE INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.calculate_movement_balance();


--
-- Name: stock_movements trg_update_stock_after_movement; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_stock_after_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.update_stock_balance();


--
-- Name: profiles trigger_prevent_super_admin_self_promotion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_prevent_super_admin_self_promotion BEFORE UPDATE ON public.profiles FOR EACH ROW WHEN ((old.is_super_admin IS DISTINCT FROM new.is_super_admin)) EXECUTE FUNCTION public.prevent_super_admin_self_promotion();


--
-- Name: guests update_guests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ideas update_ideas_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ideas_modtime BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tickets update_tickets_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: audit_log audit_log_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: booking_charges booking_charges_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_charges
    ADD CONSTRAINT booking_charges_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_guests booking_guests_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guests
    ADD CONSTRAINT booking_guests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_guests booking_guests_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guests
    ADD CONSTRAINT booking_guests_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: booking_rooms booking_rooms_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_rooms booking_rooms_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: booking_rooms booking_rooms_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE RESTRICT;


--
-- Name: booking_rooms booking_rooms_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_rooms
    ADD CONSTRAINT booking_rooms_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT;


--
-- Name: bookings bookings_current_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_current_room_id_fkey FOREIGN KEY (current_room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.reservation_leads(id);


--
-- Name: bookings bookings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_room_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE SET NULL;


--
-- Name: departments departments_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: amenities fk_amenities_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT fk_amenities_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: item_stock fk_item_stock_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_stock
    ADD CONSTRAINT fk_item_stock_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pricing_rules fk_pricing_rules_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT fk_pricing_rules_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: room_categories fk_room_categories_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT fk_room_categories_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: room_type_inventory fk_room_type_inventory_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_type_inventory
    ADD CONSTRAINT fk_room_type_inventory_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: room_types fk_room_types_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT fk_room_types_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: services fk_services_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT fk_services_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: website_settings fk_website_settings_org_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_settings
    ADD CONSTRAINT fk_website_settings_org_id FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: guest_consents guest_consents_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_consents
    ADD CONSTRAINT guest_consents_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: hostconnect_onboarding hostconnect_onboarding_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_onboarding
    ADD CONSTRAINT hostconnect_onboarding_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: hostconnect_onboarding hostconnect_onboarding_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_onboarding
    ADD CONSTRAINT hostconnect_onboarding_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: hostconnect_staff hostconnect_staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hostconnect_staff
    ADD CONSTRAINT hostconnect_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: idea_comments idea_comments_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_comments
    ADD CONSTRAINT idea_comments_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;


--
-- Name: idea_comments idea_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_comments
    ADD CONSTRAINT idea_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ideas ideas_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: ideas ideas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ideas
    ADD CONSTRAINT ideas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inventory_items inventory_items_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: item_stock item_stock_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_stock
    ADD CONSTRAINT item_stock_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: item_stock item_stock_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_stock
    ADD CONSTRAINT item_stock_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: lead_timeline_events lead_timeline_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline_events
    ADD CONSTRAINT lead_timeline_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: lead_timeline_events lead_timeline_events_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_timeline_events
    ADD CONSTRAINT lead_timeline_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.reservation_leads(id) ON DELETE CASCADE;


--
-- Name: member_permissions member_permissions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_permissions
    ADD CONSTRAINT member_permissions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: member_permissions member_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_permissions
    ADD CONSTRAINT member_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: org_invites org_invites_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invites
    ADD CONSTRAINT org_invites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: org_members org_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: org_members org_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: pre_checkin_sessions pre_checkin_sessions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_sessions
    ADD CONSTRAINT pre_checkin_sessions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: pre_checkin_submissions pre_checkin_submissions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_submissions
    ADD CONSTRAINT pre_checkin_submissions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pre_checkin_submissions pre_checkin_submissions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_checkin_submissions
    ADD CONSTRAINT pre_checkin_submissions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pre_checkin_sessions(id) ON DELETE CASCADE;


--
-- Name: precheckin_sessions precheckin_sessions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.precheckin_sessions
    ADD CONSTRAINT precheckin_sessions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: precheckin_sessions precheckin_sessions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.precheckin_sessions
    ADD CONSTRAINT precheckin_sessions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: pricing_rules pricing_rules_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: pricing_rules pricing_rules_room_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: properties properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reservation_leads reservation_leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_leads
    ADD CONSTRAINT reservation_leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: reservation_leads reservation_leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_leads
    ADD CONSTRAINT reservation_leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: reservation_leads reservation_leads_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_leads
    ADD CONSTRAINT reservation_leads_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: reservation_quotes reservation_quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_quotes
    ADD CONSTRAINT reservation_quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: reservation_quotes reservation_quotes_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_quotes
    ADD CONSTRAINT reservation_quotes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.reservation_leads(id) ON DELETE CASCADE;


--
-- Name: reservation_quotes reservation_quotes_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservation_quotes
    ADD CONSTRAINT reservation_quotes_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: room_categories room_categories_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: room_type_inventory room_type_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_type_inventory
    ADD CONSTRAINT room_type_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: room_type_inventory room_type_inventory_room_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_type_inventory
    ADD CONSTRAINT room_type_inventory_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE CASCADE;


--
-- Name: room_types room_types_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_last_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_last_booking_id_fkey FOREIGN KEY (last_booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: rooms rooms_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: rooms rooms_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_room_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: services services_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: shift_assignments shift_assignments_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: shift_assignments shift_assignments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff_profiles(id) ON DELETE CASCADE;


--
-- Name: shift_handoffs shift_handoffs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_handoffs
    ADD CONSTRAINT shift_handoffs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: shift_handoffs shift_handoffs_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_handoffs
    ADD CONSTRAINT shift_handoffs_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: shifts shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: shifts shifts_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: staff_profiles staff_profiles_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: staff_profiles staff_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_profiles
    ADD CONSTRAINT staff_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: stock_check_items stock_check_items_daily_check_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_check_items
    ADD CONSTRAINT stock_check_items_daily_check_id_fkey FOREIGN KEY (daily_check_id) REFERENCES public.stock_daily_checks(id) ON DELETE CASCADE;


--
-- Name: stock_check_items stock_check_items_stock_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_check_items
    ADD CONSTRAINT stock_check_items_stock_item_id_fkey FOREIGN KEY (stock_item_id) REFERENCES public.stock_items(id) ON DELETE CASCADE;


--
-- Name: stock_daily_checks stock_daily_checks_checked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_daily_checks
    ADD CONSTRAINT stock_daily_checks_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES auth.users(id);


--
-- Name: stock_daily_checks stock_daily_checks_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_daily_checks
    ADD CONSTRAINT stock_daily_checks_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.stock_locations(id) ON DELETE CASCADE;


--
-- Name: stock_items stock_items_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.stock_locations(id) ON DELETE CASCADE;


--
-- Name: stock_items stock_items_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: stock_locations stock_locations_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_locations
    ADD CONSTRAINT stock_locations_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_stock_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_stock_item_id_fkey FOREIGN KEY (stock_item_id) REFERENCES public.stock_items(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: website_settings website_settings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.website_settings
    ADD CONSTRAINT website_settings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: hostconnect_onboarding Admin can delete onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete onboarding" ON public.hostconnect_onboarding FOR DELETE USING ((org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.owner_id = auth.uid()))));


--
-- Name: org_members Admins can manage org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage org members" ON public.org_members USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = org_members.org_id) AND (o.owner_id = auth.uid())))) OR public.is_org_admin_no_rls(org_id))) WITH CHECK ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = org_members.org_id) AND (o.owner_id = auth.uid())))) OR public.is_org_admin_no_rls(org_id)));


--
-- Name: organizations Admins can update organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update organization" ON public.organizations FOR UPDATE USING ((public.is_super_admin() OR public.is_org_admin(id)));


--
-- Name: org_invites Admins manage invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage invites" ON public.org_invites USING (public.is_org_admin(org_id));


--
-- Name: member_permissions Admins manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage permissions" ON public.member_permissions USING (public.is_org_admin(org_id));


--
-- Name: bookings Allow admins to manage all bookings or owner of property to man; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to manage all bookings or owner of property to man" ON public.bookings USING (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.user_id = auth.uid())))))) WITH CHECK (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.user_id = auth.uid()))))));


--
-- Name: entity_photos Allow admins to manage all photos or owner of entity to manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to manage all photos or owner of entity to manage" ON public.entity_photos USING (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = entity_photos.entity_id) AND (properties.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.room_types rt
     JOIN public.properties p ON ((rt.property_id = p.id)))
  WHERE ((rt.id = entity_photos.entity_id) AND (p.user_id = auth.uid())))))) WITH CHECK (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = entity_photos.entity_id) AND (properties.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.room_types rt
     JOIN public.properties p ON ((rt.property_id = p.id)))
  WHERE ((rt.id = entity_photos.entity_id) AND (p.user_id = auth.uid()))))));


--
-- Name: properties Allow admins to manage all properties or owner to manage their ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to manage all properties or owner to manage their " ON public.properties USING (((public.get_user_role() = 'admin'::text) OR (auth.uid() = user_id))) WITH CHECK (((public.get_user_role() = 'admin'::text) OR (auth.uid() = user_id)));


--
-- Name: room_types Allow admins to manage all room types or owner of property to m; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow admins to manage all room types or owner of property to m" ON public.room_types USING (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = room_types.property_id) AND (properties.user_id = auth.uid())))))) WITH CHECK (((public.get_user_role() = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = room_types.property_id) AND (properties.user_id = auth.uid()))))));


--
-- Name: faqs Allow authenticated users to manage faqs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage faqs" ON public.faqs TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: features Allow authenticated users to manage features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage features" ON public.features TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: integrations Allow authenticated users to manage integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage integrations" ON public.integrations TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: invoices Allow authenticated users to manage invoices for their properti; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage invoices for their properti" ON public.invoices TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = invoices.property_id) AND (properties.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = invoices.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: pricing_plans Allow authenticated users to manage pricing plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage pricing plans" ON public.pricing_plans TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: how_it_works_steps Allow authenticated users to manage steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage steps" ON public.how_it_works_steps TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: testimonials Allow authenticated users to manage testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage testimonials" ON public.testimonials TO authenticated USING ((auth.role() = 'admin'::text));


--
-- Name: bookings Allow owner to update current_room_id on bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to update current_room_id on bookings" ON public.bookings FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = bookings.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: rooms Allow owner to update last_booking_id on rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner to update last_booking_id on rooms" ON public.rooms FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = rooms.property_id) AND (properties.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = rooms.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: faqs Allow public read access for faqs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for faqs" ON public.faqs FOR SELECT USING (true);


--
-- Name: features Allow public read access for features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for features" ON public.features FOR SELECT USING (true);


--
-- Name: pricing_plans Allow public read access for pricing plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for pricing plans" ON public.pricing_plans FOR SELECT USING (true);


--
-- Name: website_settings Allow public read access for specific website settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for specific website settings" ON public.website_settings FOR SELECT USING ((setting_key = ANY (ARRAY['site_name'::text, 'site_logo_url'::text, 'site_favicon_url'::text, 'site_description'::text, 'site_about_content'::text, 'blog_url'::text, 'contact_email'::text, 'contact_phone'::text, 'social_facebook'::text, 'social_instagram'::text, 'social_google_business'::text])));


--
-- Name: how_it_works_steps Allow public read access for steps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for steps" ON public.how_it_works_steps FOR SELECT USING (true);


--
-- Name: integrations Allow public read access for visible integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for visible integrations" ON public.integrations FOR SELECT USING ((is_visible = true));


--
-- Name: testimonials Allow public read access for visible testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access for visible testimonials" ON public.testimonials FOR SELECT USING ((is_visible = true));


--
-- Name: org_invites Anyone can look up token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can look up token" ON public.org_invites FOR SELECT USING (true);


--
-- Name: website_settings Enable delete for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for authenticated users" ON public.website_settings FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: services Enable delete for users who own the property; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users who own the property" ON public.services FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = services.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: services Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users" ON public.services FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: website_settings Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users" ON public.website_settings FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: website_settings Enable update for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for authenticated users" ON public.website_settings FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: services Enable update for users who own the property; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users who own the property" ON public.services FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = services.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: expenses Manage own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Manage own expenses" ON public.expenses USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));


--
-- Name: invoices Manage own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Manage own invoices" ON public.invoices USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));


--
-- Name: services Manage own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Manage own services" ON public.services USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));


--
-- Name: tasks Manage own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Manage own tasks" ON public.tasks USING (public.check_user_access(property_id)) WITH CHECK (public.check_user_access(property_id));


--
-- Name: org_members Members can view their org members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view their org members" ON public.org_members FOR SELECT USING ((public.is_super_admin() OR (auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = org_members.org_id) AND (o.owner_id = auth.uid())))) OR public.is_org_admin_no_rls(org_id)));


--
-- Name: organizations Members can view their organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view their organizations" ON public.organizations FOR SELECT USING (((owner_id = auth.uid()) OR public.is_org_member(id)));


--
-- Name: member_permissions Members view own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members view own permissions" ON public.member_permissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: hostconnect_onboarding Org members can view onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members can view onboarding" ON public.hostconnect_onboarding FOR SELECT USING ((org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.owner_id = auth.uid()))));


--
-- Name: guest_consents Org members manage guest consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org members manage guest consents" ON public.guest_consents USING ((public.is_super_admin() OR public.is_org_member(org_id))) WITH CHECK ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: tickets Org: Users can create tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND public.is_org_member(org_id))));


--
-- Name: rooms Org: Users can delete rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can delete rooms" ON public.rooms FOR DELETE USING (((( SELECT properties.user_id
   FROM public.properties
  WHERE (properties.id = rooms.property_id)) = auth.uid()) OR ((org_id IS NOT NULL) AND public.is_org_admin(org_id))));


--
-- Name: rooms Org: Users can insert rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can insert rooms" ON public.rooms FOR INSERT WITH CHECK (((( SELECT properties.user_id
   FROM public.properties
  WHERE (properties.id = rooms.property_id)) = auth.uid()) OR ((org_id IS NOT NULL) AND public.is_org_admin(org_id))));


--
-- Name: ideas Org: Users can update own ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can update own ideas" ON public.ideas FOR UPDATE USING (((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND public.is_org_admin(org_id))));


--
-- Name: rooms Org: Users can update rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can update rooms" ON public.rooms FOR UPDATE USING (((( SELECT properties.user_id
   FROM public.properties
  WHERE (properties.id = rooms.property_id)) = auth.uid()) OR ((org_id IS NOT NULL) AND public.is_org_admin(org_id))));


--
-- Name: ideas Org: Users can view ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Org: Users can view ideas" ON public.ideas FOR SELECT USING (((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND public.is_org_member(org_id)) OR public.is_hostconnect_staff()));


--
-- Name: ticket_comments Staff inserts comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff inserts comments" ON public.ticket_comments FOR INSERT WITH CHECK (public.is_hostconnect_staff());


--
-- Name: idea_comments Staff inserts idea comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff inserts idea comments" ON public.idea_comments FOR INSERT WITH CHECK (public.is_hostconnect_staff());


--
-- Name: ideas Staff updates ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff updates ideas" ON public.ideas FOR UPDATE USING (public.is_hostconnect_staff());


--
-- Name: tickets Staff updates tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff updates tickets" ON public.tickets FOR UPDATE USING (public.is_hostconnect_staff());


--
-- Name: ticket_comments Staff views all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff views all comments" ON public.ticket_comments FOR SELECT USING (public.is_hostconnect_staff());


--
-- Name: idea_comments Staff views all idea comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff views all idea comments" ON public.idea_comments FOR SELECT USING (public.is_hostconnect_staff());


--
-- Name: ideas Staff views all ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff views all ideas" ON public.ideas FOR SELECT USING (public.is_hostconnect_staff());


--
-- Name: tickets Staff views all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff views all tickets" ON public.tickets FOR SELECT USING (public.is_hostconnect_staff());


--
-- Name: audit_log Staff views audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff views audit logs" ON public.audit_log FOR SELECT USING (public.is_hostconnect_staff());


--
-- Name: hostconnect_onboarding Staff+ can create onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff+ can create onboarding" ON public.hostconnect_onboarding FOR INSERT WITH CHECK ((org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.owner_id = auth.uid()))));


--
-- Name: hostconnect_onboarding Staff+ can update onboarding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff+ can update onboarding" ON public.hostconnect_onboarding FOR UPDATE USING ((org_id IN ( SELECT organizations.id
   FROM public.organizations
  WHERE (organizations.owner_id = auth.uid()))));


--
-- Name: bookings Strict: Org Admins delete bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Admins delete bookings" ON public.bookings FOR DELETE USING (public.is_org_admin(org_id));


--
-- Name: properties Strict: Org Admins delete properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Admins delete properties" ON public.properties FOR DELETE USING (public.is_org_admin(org_id));


--
-- Name: properties Strict: Org Admins insert properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Admins insert properties" ON public.properties FOR INSERT WITH CHECK (public.is_org_admin(org_id));


--
-- Name: properties Strict: Org Admins update properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Admins update properties" ON public.properties FOR UPDATE USING (public.is_org_admin(org_id));


--
-- Name: bookings Strict: Org Members insert bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members insert bookings" ON public.bookings FOR INSERT WITH CHECK (public.is_org_member(org_id));


--
-- Name: bookings Strict: Org Members update bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members update bookings" ON public.bookings FOR UPDATE USING (public.is_org_member(org_id));


--
-- Name: bookings Strict: Org Members view bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members view bookings" ON public.bookings FOR SELECT USING (public.is_org_member(org_id));


--
-- Name: properties Strict: Org Members view properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members view properties" ON public.properties FOR SELECT USING (public.is_org_member(org_id));


--
-- Name: rooms Strict: Org Members view rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members view rooms" ON public.rooms FOR SELECT USING (public.is_org_member(org_id));


--
-- Name: tickets Strict: Org Members view tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Strict: Org Members view tickets" ON public.tickets FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: organizations Users can create organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (true);


--
-- Name: booking_rooms Users can delete booking_rooms for their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete booking_rooms for their org" ON public.booking_rooms FOR DELETE USING ((org_id = ( SELECT booking_rooms.org_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: booking_charges Users can delete charges of their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete charges of their bookings" ON public.booking_charges FOR DELETE USING (public.check_booking_access(booking_id));


--
-- Name: expenses Users can delete expenses for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete expenses for their properties" ON public.expenses FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = expenses.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: rooms Users can delete rooms of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete rooms of their properties" ON public.rooms FOR DELETE USING (public.check_user_access(property_id));


--
-- Name: pricing_rules Users can delete rules of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete rules of their properties" ON public.pricing_rules FOR DELETE USING (public.check_user_access(property_id));


--
-- Name: tasks Users can delete tasks for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete tasks for their properties" ON public.tasks FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = tasks.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: booking_rooms Users can insert booking_rooms for their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert booking_rooms for their org" ON public.booking_rooms FOR INSERT WITH CHECK ((org_id = ( SELECT booking_rooms.org_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: booking_charges Users can insert charges for their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert charges for their bookings" ON public.booking_charges FOR INSERT WITH CHECK (public.check_booking_access(booking_id));


--
-- Name: expenses Users can insert expenses for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert expenses for their properties" ON public.expenses FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = expenses.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: rooms Users can insert rooms for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert rooms for their properties" ON public.rooms FOR INSERT WITH CHECK (public.check_user_access(property_id));


--
-- Name: pricing_rules Users can insert rules for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert rules for their properties" ON public.pricing_rules FOR INSERT WITH CHECK (public.check_user_access(property_id));


--
-- Name: tasks Users can insert tasks for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert tasks for their properties" ON public.tasks FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = tasks.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: notifications Users can insert their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: bookings Users can manage bookings in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage bookings in their org" ON public.bookings USING ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: room_categories Users can manage categories in their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage categories in their properties" ON public.room_categories USING ((property_id IN ( SELECT p.id
   FROM ((public.properties p
     JOIN public.organizations o ON ((o.id = p.org_id)))
     JOIN public.org_members om ON ((om.org_id = o.id)))
  WHERE (om.user_id = auth.uid()))));


--
-- Name: guests Users can manage guests in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage guests in their org" ON public.guests USING ((public.is_super_admin() OR public.is_org_member(org_id))) WITH CHECK ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: properties Users can manage properties in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage properties in their org" ON public.properties USING ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: rooms Users can manage rooms in their property; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage rooms in their property" ON public.rooms USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = rooms.property_id) AND public.is_org_member(p.org_id))))));


--
-- Name: booking_rooms Users can update booking_rooms for their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update booking_rooms for their org" ON public.booking_rooms FOR UPDATE USING ((org_id = ( SELECT booking_rooms.org_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: booking_charges Users can update charges of their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update charges of their bookings" ON public.booking_charges FOR UPDATE USING (public.check_booking_access(booking_id));


--
-- Name: expenses Users can update expenses for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update expenses for their properties" ON public.expenses FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = expenses.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: rooms Users can update rooms of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update rooms of their properties" ON public.rooms FOR UPDATE USING (public.check_user_access(property_id));


--
-- Name: pricing_rules Users can update rules of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update rules of their properties" ON public.pricing_rules FOR UPDATE USING (public.check_user_access(property_id));


--
-- Name: tasks Users can update tasks for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks for their properties" ON public.tasks FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = tasks.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: booking_rooms Users can view booking_rooms for their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view booking_rooms for their org" ON public.booking_rooms FOR SELECT USING ((org_id = ( SELECT booking_rooms.org_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: bookings Users can view bookings in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view bookings in their org" ON public.bookings FOR SELECT USING ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: room_categories Users can view categories in their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view categories in their properties" ON public.room_categories FOR SELECT USING ((property_id IN ( SELECT p.id
   FROM ((public.properties p
     JOIN public.organizations o ON ((o.id = p.org_id)))
     JOIN public.org_members om ON ((om.org_id = o.id)))
  WHERE (om.user_id = auth.uid()))));


--
-- Name: booking_charges Users can view charges of their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view charges of their bookings" ON public.booking_charges FOR SELECT USING (public.check_booking_access(booking_id));


--
-- Name: expenses Users can view expenses for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view expenses for their properties" ON public.expenses FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = expenses.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: guests Users can view guests in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view guests in their org" ON public.guests FOR SELECT USING ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: booking_guests Users can view own org booking guests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own org booking guests" ON public.booking_guests FOR SELECT USING ((org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting)));


--
-- Name: precheckin_sessions Users can view own org precheckin sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own org precheckin sessions" ON public.precheckin_sessions FOR SELECT USING ((org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting)));


--
-- Name: properties Users can view properties in their org; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view properties in their org" ON public.properties FOR SELECT USING ((public.is_super_admin() OR public.is_org_member(org_id)));


--
-- Name: rooms Users can view rooms in their property; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view rooms in their property" ON public.rooms FOR SELECT USING ((public.is_super_admin() OR (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = rooms.property_id) AND public.is_org_member(p.org_id))))));


--
-- Name: rooms Users can view rooms of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view rooms of their properties" ON public.rooms FOR SELECT USING (public.check_user_access(property_id));


--
-- Name: pricing_rules Users can view rules of their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view rules of their properties" ON public.pricing_rules FOR SELECT USING (public.check_user_access(property_id));


--
-- Name: tasks Users can view tasks for their properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks for their properties" ON public.tasks FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.properties
  WHERE ((properties.id = tasks.property_id) AND (properties.user_id = auth.uid())))));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: properties Users can view their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own properties" ON public.properties FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: idea_comments Users comment on own ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users comment on own ideas" ON public.idea_comments FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.ideas
  WHERE ((ideas.id = idea_comments.idea_id) AND (ideas.user_id = auth.uid()))))));


--
-- Name: ticket_comments Users comment on own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users comment on own tickets" ON public.ticket_comments FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = ticket_comments.ticket_id) AND (tickets.user_id = auth.uid()))))));


--
-- Name: ideas Users insert own ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own ideas" ON public.ideas FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tickets Users inset own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users inset own tickets" ON public.tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: idea_comments Users view comments on own ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view comments on own ideas" ON public.idea_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ideas
  WHERE ((ideas.id = idea_comments.idea_id) AND (ideas.user_id = auth.uid())))));


--
-- Name: ticket_comments Users view comments on own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view comments on own tickets" ON public.ticket_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = ticket_comments.ticket_id) AND (tickets.user_id = auth.uid())))));


--
-- Name: ideas Users view own ideas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own ideas" ON public.ideas FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tickets Users view own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own tickets" ON public.tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: amenities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_charges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_guests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entity_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

--
-- Name: features; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

--
-- Name: guest_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guest_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: guests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

--
-- Name: hostconnect_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hostconnect_onboarding ENABLE ROW LEVEL SECURITY;

--
-- Name: hostconnect_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hostconnect_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: how_it_works_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.how_it_works_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: idea_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: ideas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: item_stock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_stock ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_timeline_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_timeline_events ENABLE ROW LEVEL SECURITY;

--
-- Name: member_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: amenities org_admins_delete_amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_amenities ON public.amenities FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: inventory_items org_admins_delete_inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_inventory_items ON public.inventory_items FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: item_stock org_admins_delete_item_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_item_stock ON public.item_stock FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: pricing_rules org_admins_delete_pricing_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_pricing_rules ON public.pricing_rules FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_categories org_admins_delete_room_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_room_categories ON public.room_categories FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_type_inventory org_admins_delete_room_type_inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_room_type_inventory ON public.room_type_inventory FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_types org_admins_delete_room_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_room_types ON public.room_types FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: services org_admins_delete_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_services ON public.services FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: website_settings org_admins_delete_website_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_delete_website_settings ON public.website_settings FOR DELETE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: amenities org_admins_insert_amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_amenities ON public.amenities FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: pricing_rules org_admins_insert_pricing_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_pricing_rules ON public.pricing_rules FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_categories org_admins_insert_room_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_room_categories ON public.room_categories FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_types org_admins_insert_room_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_room_types ON public.room_types FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: services org_admins_insert_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_services ON public.services FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: website_settings org_admins_insert_website_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_insert_website_settings ON public.website_settings FOR INSERT WITH CHECK ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: amenities org_admins_update_amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_amenities ON public.amenities FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: pricing_rules org_admins_update_pricing_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_pricing_rules ON public.pricing_rules FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_categories org_admins_update_room_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_room_categories ON public.room_categories FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_types org_admins_update_room_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_room_types ON public.room_types FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: services org_admins_update_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_services ON public.services FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: website_settings org_admins_update_website_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_admins_update_website_settings ON public.website_settings FOR UPDATE USING ((public.is_org_admin(org_id) OR public.is_hostconnect_staff()));


--
-- Name: rooms org_delete_rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_rooms ON public.rooms FOR DELETE USING ((org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting)));


--
-- Name: rooms org_insert_rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_rooms ON public.rooms FOR INSERT WITH CHECK (((auth.role() = 'authenticated'::text) AND (org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting))));


--
-- Name: org_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: org_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items org_members_insert_inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_insert_inventory_items ON public.inventory_items FOR INSERT WITH CHECK ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: item_stock org_members_insert_item_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_insert_item_stock ON public.item_stock FOR INSERT WITH CHECK ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_type_inventory org_members_insert_room_type_inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_insert_room_type_inventory ON public.room_type_inventory FOR INSERT WITH CHECK ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: amenities org_members_select_amenities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_amenities ON public.amenities FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: inventory_items org_members_select_inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_inventory_items ON public.inventory_items FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: item_stock org_members_select_item_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_item_stock ON public.item_stock FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: pricing_rules org_members_select_pricing_rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_pricing_rules ON public.pricing_rules FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_categories org_members_select_room_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_room_categories ON public.room_categories FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_type_inventory org_members_select_room_type_inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_room_type_inventory ON public.room_type_inventory FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_types org_members_select_room_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_room_types ON public.room_types FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: services org_members_select_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_services ON public.services FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: website_settings org_members_select_website_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_select_website_settings ON public.website_settings FOR SELECT USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: org_members org_members_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_self_read ON public.org_members FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: inventory_items org_members_update_inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_update_inventory_items ON public.inventory_items FOR UPDATE USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: item_stock org_members_update_item_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_update_item_stock ON public.item_stock FOR UPDATE USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: room_type_inventory org_members_update_room_type_inventory; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_members_update_room_type_inventory ON public.room_type_inventory FOR UPDATE USING ((public.is_org_member(org_id) OR public.is_hostconnect_staff()));


--
-- Name: rooms org_select_rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_rooms ON public.rooms FOR SELECT USING ((org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting)));


--
-- Name: rooms org_update_rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_rooms ON public.rooms FOR UPDATE USING ((org_id = ( SELECT (current_setting('app.current_org_id'::text, true))::uuid AS current_setting)));


--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: precheckin_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.precheckin_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));


--
-- Name: profiles profiles_read_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_read_authenticated ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: profiles profiles_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: reservation_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reservation_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: reservation_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reservation_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: room_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: room_type_inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.room_type_inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: room_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

--
-- Name: rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_handoffs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_handoffs ENABLE ROW LEVEL SECURITY;

--
-- Name: shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_check_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_check_items ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_daily_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_daily_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: website_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Anyone can view property photos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view property photos" ON storage.objects FOR SELECT USING ((bucket_id = 'property-photos'::text));


--
-- Name: objects Users can delete own photos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'property-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can update own photos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'property-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload photos to own folders; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload photos to own folders" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'property-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict LFmf9ywLXgknIDR6hC5mWLhF7R6OWrFczAD4N5SBpXC8mLpX0VV02hhd8O4eLFp

