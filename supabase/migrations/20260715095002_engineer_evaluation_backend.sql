create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null,
  evaluator_id text,
  engineer_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username ~ '^[a-z0-9._-]{4,40}$'
  ),
  constraint profiles_display_name_length check (
    char_length(btrim(display_name)) between 1 and 50
  ),
  constraint profiles_role check (
    role in ('operator', 'evaluator', 'approver', 'engineer')
  ),
  constraint profiles_role_link check (
    (role = 'evaluator' and evaluator_id is not null and engineer_id is null)
    or (role = 'engineer' and evaluator_id is null and engineer_id is not null)
    or (role in ('operator', 'approver') and evaluator_id is null and engineer_id is null)
  )
);

create unique index profiles_evaluator_id_uq
  on public.profiles (evaluator_id)
  where evaluator_id is not null;

create unique index profiles_engineer_id_uq
  on public.profiles (engineer_id)
  where engineer_id is not null;

create table public.evaluation_state (
  id text primary key,
  snapshot jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint evaluation_state_singleton check (id = 'primary'),
  constraint evaluation_state_snapshot_object check (jsonb_typeof(snapshot) = 'object'),
  constraint evaluation_state_revision_nonnegative check (revision >= 0)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_role text not null,
  operation text not null,
  target_id text,
  revision bigint not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_actor_role check (
    actor_role in ('operator', 'evaluator', 'approver', 'engineer', 'system')
  ),
  constraint audit_log_operation_length check (
    char_length(btrim(operation)) between 1 and 100
  ),
  constraint audit_log_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_log_actor_created_at_idx
  on public.audit_log (actor_user_id, created_at desc);

create index audit_log_operation_created_at_idx
  on public.audit_log (operation, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log rows are immutable';
end;
$$;

create or replace function private.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where auth_user_id = (select auth.uid())
        and role = 'operator'
        and active
    );
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke execute on function private.prevent_audit_log_mutation() from public, anon, authenticated, service_role;
revoke execute on function private.is_operator() from public, anon, authenticated, service_role;
grant execute on function private.is_operator() to authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger evaluation_state_set_updated_at
before update on public.evaluation_state
for each row execute function private.set_updated_at();

create trigger audit_log_prevent_update_delete
before update or delete on public.audit_log
for each row execute function private.prevent_audit_log_mutation();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.evaluation_state enable row level security;
alter table public.evaluation_state force row level security;
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

create policy profiles_select_self_or_operator
on public.profiles
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select private.is_operator())
);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

revoke all on public.evaluation_state from anon, authenticated;
grant select, insert, update on public.evaluation_state to service_role;

revoke all on public.audit_log from anon, authenticated;
grant select, insert on public.audit_log to service_role;
grant usage, select on sequence public.audit_log_id_seq to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

insert into public.evaluation_state (id, snapshot)
values (
  'primary',
  jsonb_build_object(
    'schemaVersion', 5,
    'cycles', jsonb_build_array(
      jsonb_build_object(
        'id', 'cycle-initial-2026',
        'name', '2026 역량평가',
        'status', 'setup',
        'startsAt', '2026-07-15',
        'endsAt', '2026-12-31'
      )
    ),
    'tasks', '[]'::jsonb,
    'engineerTaskWeights', '[]'::jsonb,
    'engineers', '[]'::jsonb,
    'evaluators', '[]'::jsonb,
    'assignments', '[]'::jsonb,
    'scoreSheets', '[]'::jsonb,
    'directScores', '[]'::jsonb,
    'languageScoreRecords', '[]'::jsonb,
    'certificationRecords', '[]'::jsonb,
    'scheduleEvents', '[]'::jsonb,
    'auditEvents', '[]'::jsonb
  )
);
