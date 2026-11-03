-- ============================================================
-- QR-ATT — ADMIN DASHBOARD SETUP / MIGRATION
--
-- Run this file AFTER supabase/schema.sql in the Supabase SQL Editor.
-- It is written to be safe to run more than once.
--
-- It adds:
--   * the "admin" role and account status
--   * student/teacher profile details
--   * event descriptions
--   * secure per-event QR tokens
--   * RLS policies for students, teachers, and administrators
--   * server-side admin role / status management
--   * server-side QR attendance validation
--
-- ── GRANTING THE FIRST ADMINISTRATOR ─────────────────────────
-- After this script succeeds, run this once in the SQL Editor with
-- the email of the account that should become the first admin:
--
--   update public.profiles
--      set role = 'admin', is_active = true
--    where lower(email) = lower('you@school.edu');
--
-- Then sign out and back in inside the app. Never put a service-role
-- key in the Expo client or in EXPO_PUBLIC_* variables.
-- ============================================================


-- ------------------------------------------------------------
-- 1. PROFILE COLUMNS + ROLE MODEL
-- ------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'teacher', 'admin'));

alter table public.profiles
  add column if not exists is_active boolean not null default true;
alter table public.profiles
  add column if not exists student_number text;
alter table public.profiles
  add column if not exists employee_number text;
alter table public.profiles
  add column if not exists grade_level text;
alter table public.profiles
  add column if not exists section text;
alter table public.profiles
  add column if not exists department text;
alter table public.profiles
  add column if not exists phone text;

create unique index if not exists profiles_student_number_unique
  on public.profiles (lower(btrim(student_number)))
  where student_number is not null and btrim(student_number) <> '';

create unique index if not exists profiles_employee_number_unique
  on public.profiles (lower(btrim(employee_number)))
  where employee_number is not null and btrim(employee_number) <> '';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_active_idx on public.profiles (is_active);


-- ------------------------------------------------------------
-- 2. EVENT COLUMNS
-- ------------------------------------------------------------
alter table public.events
  add column if not exists description text;
alter table public.events
  add column if not exists updated_at timestamptz not null default now();

create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists attendance_student_idx on public.attendance (student_id);
create index if not exists attendance_event_idx on public.attendance (event_id);

-- Attendance must be unique per student and event. schema.sql creates this as
-- a UNIQUE constraint; older or partially-created databases may be missing it,
-- and register_attendance_qr() relies on ON CONFLICT (student_id, event_id).
do $$
declare
  duplicate_groups integer;
begin
  select count(*) into duplicate_groups
    from (
      select student_id, event_id
        from public.attendance
       group by student_id, event_id
      having count(*) > 1
    ) duplicates;

  if duplicate_groups > 0 then
    delete from public.attendance a
     using public.attendance b
     where a.student_id = b.student_id
       and a.event_id = b.event_id
       and (a.scanned_at, a.id) > (b.scanned_at, b.id);

    raise notice 'Removed duplicate attendance rows (kept the earliest scan per student/event).';
  end if;
end;
$$;

create unique index if not exists attendance_student_event_unique
  on public.attendance (student_id, event_id);


-- ------------------------------------------------------------
-- 3. SECURE EVENT QR TOKENS
--
-- Tokens live in a table with no client grants. Only SECURITY DEFINER
-- functions below can read or rotate them. A token proves that the QR
-- code was issued for a real event by an admin or the event owner.
-- ------------------------------------------------------------
create table if not exists public.event_qr_tokens (
  event_id uuid primary key references public.events (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  rotated_at timestamptz not null default now()
);

alter table public.event_qr_tokens enable row level security;
revoke all on table public.event_qr_tokens from anon, authenticated;


-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS
--
-- Some earlier admin setups define is_admin(uuid DEFAULT auth.uid())
-- or another overload. A zero-argument call then becomes ambiguous
-- (PostgreSQL 42725: function public.is_admin() is not unique).
-- Rename legacy overloads instead of dropping them so existing
-- policies that depend on them keep working.
-- ------------------------------------------------------------
do $$
declare
  fn record;
begin
  for fn in
    select p.oid,
           p.oid::regprocedure as signature,
           p.proname as name
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and p.proname in ('is_admin', 'is_active_user', 'is_teacher')
       and pg_get_function_identity_arguments(p.oid) <> ''
  loop
    execute format(
      'alter function %s rename to %I',
      fn.signature,
      fn.name::text || '_legacy_' || fn.oid::text
    );
  end loop;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'admin'
       and is_active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and is_active = true
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.profiles
     where id = auth.uid()
       and role = 'teacher'
       and is_active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_user() from public, anon;
revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_teacher() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();


-- ------------------------------------------------------------
-- 5. PROFILE CREATION + SELF-ESCALATION GUARD
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('student', 'teacher')
      then new.raw_user_meta_data ->> 'role'
    else 'student'
  end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.guard_profile_mutations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_admin_count integer;
begin
  if tg_op = 'INSERT' then
    -- Client-supplied metadata can never create an administrator. Admin
    -- accounts are created through the admin Edge Function / service role.
    if new.role = 'admin' and auth.uid() is not null and not public.is_admin() then
      new.role := 'student';
    end if;
    return new;
  end if;

  if auth.uid() is not null then
    if auth.uid() = new.id and new.role is distinct from old.role then
      raise exception 'You cannot change your own role.';
    end if;

    if auth.uid() = new.id and new.is_active is distinct from old.is_active then
      raise exception 'You cannot change your own account status.';
    end if;

    if (new.role is distinct from old.role
        or new.is_active is distinct from old.is_active)
       and not public.is_admin() then
      raise exception 'Only an active administrator can change roles or account status.';
    end if;
  end if;

  if old.role = 'admin' and new.role is distinct from 'admin' then
    select count(*) into active_admin_count
      from public.profiles
     where role = 'admin' and is_active = true and id <> old.id;

    if active_admin_count = 0 then
      raise exception 'At least one active administrator must remain.';
    end if;
  end if;

  if old.is_active = true and new.is_active = false and old.role = 'admin' then
    select count(*) into active_admin_count
      from public.profiles
     where role = 'admin' and is_active = true and id <> old.id;

    if active_admin_count = 0 then
      raise exception 'At least one active administrator must remain.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_mutations on public.profiles;
create trigger profiles_guard_mutations
  before insert or update on public.profiles
  for each row execute procedure public.guard_profile_mutations();


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;

-- Remove legacy policies from supabase/schema.sql.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Teachers can view profiles of their attendees" on public.profiles;
drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or (
      public.is_active_user()
      and (
        public.is_admin()
        or (
          public.is_teacher()
          and exists (
            select 1
              from public.attendance a
              join public.events e on e.id = a.event_id
             where a.student_id = profiles.id
               and e.created_by = auth.uid()
          )
        )
      )
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role in ('student', 'teacher')
    and is_active = true
  );

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (
    public.is_active_user()
    and (auth.uid() = id or public.is_admin())
  )
  with check (
    public.is_active_user()
    and (auth.uid() = id or public.is_admin())
  );

-- Events: everyone signed in can read; teachers own their events; admins all.
drop policy if exists "Events are readable by any authenticated user" on public.events;
drop policy if exists "Users can insert events" on public.events;
drop policy if exists "Users can update their own events" on public.events;
drop policy if exists "events_select_authenticated" on public.events;
drop policy if exists "events_insert_admin_or_owner" on public.events;
drop policy if exists "events_update_admin_or_owner" on public.events;
drop policy if exists "events_delete_admin" on public.events;

create policy "events_select_authenticated"
  on public.events for select
  to authenticated
  using (public.is_active_user());

create policy "events_insert_admin_or_owner"
  on public.events for insert
  to authenticated
  with check (
    public.is_active_user()
    and (
      public.is_admin()
      or (public.is_teacher() and created_by = auth.uid())
    )
  );

create policy "events_update_admin_or_owner"
  on public.events for update
  to authenticated
  using (
    public.is_admin()
    or (public.is_teacher() and created_by = auth.uid())
  )
  with check (
    public.is_admin()
    or (public.is_teacher() and created_by = auth.uid())
  );

create policy "events_delete_admin"
  on public.events for delete
  to authenticated
  using (public.is_admin());

-- Attendance: own records, teacher's events, or all records for admins.
-- Students may NOT insert directly: every QR scan goes through the
-- register_attendance_qr() function below.
drop policy if exists "Students can view their own attendance" on public.attendance;
drop policy if exists "Students can insert their own attendance" on public.attendance;
drop policy if exists "Teachers can view attendance for their events" on public.attendance;
drop policy if exists "attendance_select_own_teacher_admin" on public.attendance;
drop policy if exists "attendance_delete_admin" on public.attendance;

create policy "attendance_select_own_teacher_admin"
  on public.attendance for select
  to authenticated
  using (
    public.is_active_user()
    and (
      auth.uid() = student_id
      or public.is_admin()
      or (
        public.is_teacher()
        and exists (
          select 1
            from public.events e
           where e.id = attendance.event_id
             and e.created_by = auth.uid()
        )
      )
    )
  );

create policy "attendance_delete_admin"
  on public.attendance for delete
  to authenticated
  using (public.is_admin());


-- ------------------------------------------------------------
-- 7. ADMIN ROLE / STATUS FUNCTIONS
-- These are the only client-callable way to change privileged
-- fields. They verify the caller again on the server.
-- ------------------------------------------------------------
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  old_role text;
  remaining_admins integer;
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can change roles.';
  end if;

  -- Serialize privileged changes so two concurrent demotions cannot both
  -- observe another active administrator and leave none behind.
  perform pg_advisory_xact_lock(hashtext('qr_attendance_admin_guard'));

  if p_role not in ('student', 'teacher', 'admin') then
    raise exception 'Invalid role.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;

  select role into old_role
    from public.profiles
   where id = p_user_id
   for update;

  if old_role is null then
    raise exception 'User not found.';
  end if;

  if old_role = 'admin' and p_role <> 'admin' then
    select count(*) into remaining_admins
      from public.profiles
     where role = 'admin' and is_active = true and id <> p_user_id;

    if remaining_admins = 0 then
      raise exception 'At least one active administrator must remain.';
    end if;
  end if;

  update public.profiles
     set role = p_role
   where id = p_user_id;

  update auth.users
     set raw_user_meta_data =
           jsonb_set(
             coalesce(raw_user_meta_data, '{}'::jsonb),
             '{role}',
             to_jsonb(p_role),
             true
           )
   where id = p_user_id;
end;
$$;

create or replace function public.admin_set_user_active(
  p_user_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
  remaining_admins integer;
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can change account status.';
  end if;

  -- See admin_set_user_role(): keep the last-admin invariant under concurrency.
  perform pg_advisory_xact_lock(hashtext('qr_attendance_admin_guard'));

  if p_user_id = auth.uid() and p_active = false then
    raise exception 'You cannot deactivate your own account.';
  end if;

  select role into target_role
    from public.profiles
   where id = p_user_id
   for update;

  if target_role is null then
    raise exception 'User not found.';
  end if;

  if p_active = false and target_role = 'admin' then
    select count(*) into remaining_admins
      from public.profiles
     where role = 'admin' and is_active = true and id <> p_user_id;

    if remaining_admins = 0 then
      raise exception 'At least one active administrator must remain.';
    end if;
  end if;

  update public.profiles
     set is_active = p_active
   where id = p_user_id;

  -- Stop new logins immediately. Existing sessions lose data access through
  -- is_active_user() in the RLS policies and are signed out by the app.
  update auth.users
     set banned_until = case
       when p_active then null
       else 'infinity'::timestamptz
     end
   where id = p_user_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
revoke all on function public.admin_set_user_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;


-- ------------------------------------------------------------
-- 8. EVENT QR TOKEN FUNCTIONS
-- ------------------------------------------------------------
create or replace function public.get_event_qr_token(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if auth.uid() is null or not public.is_active_user() then
    raise exception 'You must be signed in.';
  end if;

  if not (
    public.is_admin()
    or (
      public.is_teacher()
      and exists (
        select 1 from public.events
         where id = p_event_id and created_by = auth.uid()
      )
    )
  ) then
    raise exception 'You are not allowed to generate a QR code for this event.';
  end if;

  insert into public.event_qr_tokens (event_id)
  values (p_event_id)
  on conflict (event_id) do nothing;

  select token into v_token
    from public.event_qr_tokens
   where event_id = p_event_id;

  return v_token;
end;
$$;

create or replace function public.admin_rotate_event_qr_token(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can rotate event QR codes.';
  end if;

  insert into public.event_qr_tokens (event_id, token, rotated_at)
  values (p_event_id, gen_random_uuid(), now())
  on conflict (event_id) do update
    set token = gen_random_uuid(),
        rotated_at = now()
  returning token into v_token;

  return v_token;
end;
$$;

revoke all on function public.get_event_qr_token(uuid) from public, anon;
revoke all on function public.admin_rotate_event_qr_token(uuid) from public, anon;
grant execute on function public.get_event_qr_token(uuid) to authenticated;
grant execute on function public.admin_rotate_event_qr_token(uuid) to authenticated;


-- ------------------------------------------------------------
-- 9. SERVER-SIDE QR ATTENDANCE VALIDATION
-- ------------------------------------------------------------
create or replace function public.register_attendance_qr(
  p_event_code text,
  p_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
  v_token uuid;
  v_attendance_id uuid;
  v_now timestamptz := now();
begin
  if v_user is null then
    return jsonb_build_object(
      'success', false,
      'message', 'You must be signed in to record attendance.'
    );
  end if;

  if not public.is_active_user() then
    return jsonb_build_object(
      'success', false,
      'message', 'This account is not active. Contact an administrator.'
    );
  end if;

  select * into v_event
    from public.events
   where event_code = p_event_code
   limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'This event could not be found. Ask for a current QR code.'
    );
  end if;

  select token into v_token
    from public.event_qr_tokens
   where event_id = v_event.id;

  if v_token is not null then
    if p_token is null or p_token <> v_token then
      return jsonb_build_object(
        'success', false,
        'message', 'This QR code is invalid or has been replaced. Ask for a new one.'
      );
    end if;
  elsif p_token is not null then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code is invalid. Ask for a new one.'
    );
  end if;

  if v_event.start_time is not null and v_now < v_event.start_time then
    return jsonb_build_object(
      'success', false,
      'message', 'This event has not started yet.'
    );
  end if;

  if v_event.end_time is not null
     and v_now > v_event.end_time + interval '24 hours' then
    return jsonb_build_object(
      'success', false,
      'message', 'This event has already ended.'
    );
  end if;

  insert into public.attendance (student_id, event_id)
  values (v_user, v_event.id)
  on conflict (student_id, event_id) do nothing
  returning id into v_attendance_id;

  if v_attendance_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'You are already registered for this event.',
      'event_title', v_event.title
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'message', 'Attendance recorded!',
    'event_title', v_event.title
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', 'Attendance could not be recorded. Please try again.'
    );
end;
$$;

revoke all on function public.register_attendance_qr(text, uuid) from public, anon;
grant execute on function public.register_attendance_qr(text, uuid) to authenticated;


-- ------------------------------------------------------------
-- 10. LEGACY ADMIN OBJECT CLEANUP
--
-- Earlier iterations of this setup used is_administrator(),
-- qratt_is_admin() (both tested for role = 'administrator'), and
-- is_admin(uuid DEFAULT auth.uid()) which did not require an active account.
-- Permissive RLS policies are ORed together, so leaving those policies in
-- place would keep an old access path alive even after the secure policies
-- above were added. Remove the old triggers, policies, and helper functions.
-- ------------------------------------------------------------
drop trigger if exists guard_profile_role on public.profiles;

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and (
         coalesce(qual, '') ~* '(is_administrator|qratt_is_admin|is_admin_legacy_[0-9]+)'
         or coalesce(with_check, '') ~* '(is_administrator|qratt_is_admin|is_admin_legacy_[0-9]+)'
       )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  end loop;
end;
$$;

-- Event deletion is administrator-only in the current role model.
drop policy if exists "Users can delete their own events" on public.events;

-- Drop dependent legacy trigger/reporting functions before their admin
-- helper functions.
drop function if exists public.guard_profile_role() cascade;
drop function if exists public.admin_event_summary() cascade;
drop function if exists public.is_administrator() cascade;
drop function if exists public.qratt_is_admin() cascade;

-- Older setups exposed set_profile() through PostgREST. It is SECURITY DEFINER
-- and accepts an arbitrary user id, e-mail, name and role, so anonymous
-- callers must never be able to reach it. The current app does not use it.
drop function if exists public.set_profile(uuid, text, text, text) cascade;

-- Trigger functions execute as part of their triggers and do not need API
-- execute grants. Supabase's default privileges otherwise leave anon able to
-- invoke them.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_profile_mutations() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname ~ '^(is_admin|is_active_user|is_teacher)_legacy_[0-9]+$'
  loop
    execute format('drop function if exists %s cascade', fn.signature);
  end loop;
end;
$$;


-- ------------------------------------------------------------
-- 11. FINAL NOTES
-- ------------------------------------------------------------
-- The first administrator must be granted from the SQL Editor (not from
-- the mobile client):
--
--   update public.profiles
--      set role = 'admin', is_active = true
--    where lower(email) = lower('you@school.edu');
--
-- Optional verification queries:
--
--   select email, role, is_active from public.profiles order by created_at;
--   select event_code, title, start_time, end_time from public.events;
--   select count(*) from public.attendance;
-- ============================================================
