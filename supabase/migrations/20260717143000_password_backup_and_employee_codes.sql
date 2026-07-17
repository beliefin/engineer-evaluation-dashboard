alter table public.profiles
  add column if not exists must_change_password boolean not null default true;

create table if not exists public.evaluation_state_backups (
  id uuid primary key default gen_random_uuid(),
  revision bigint not null check (revision >= 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  label text not null check (char_length(label) between 1 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists evaluation_state_backups_created_at_idx
  on public.evaluation_state_backups (created_at desc);

alter table public.evaluation_state_backups enable row level security;
alter table public.evaluation_state_backups force row level security;
revoke all on public.evaluation_state_backups from public, anon, authenticated;
grant select, insert on public.evaluation_state_backups to service_role;

create or replace function public.restore_evaluation_state_backup(
  p_backup_id uuid,
  p_expected_revision bigint,
  p_actor_user_id uuid
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_backup_revision bigint;
  v_current_snapshot jsonb;
  v_current_revision bigint;
  v_next_revision bigint;
begin
  select snapshot, revision
    into v_snapshot, v_backup_revision
  from public.evaluation_state_backups
  where id = p_backup_id;

  if v_snapshot is null then
    raise exception 'backup_not_found' using errcode = 'P0002';
  end if;

  select snapshot, revision
    into v_current_snapshot, v_current_revision
  from public.evaluation_state
  where id = 'primary'
  for update;

  if v_current_revision <> p_expected_revision then
    raise exception 'state_revision_conflict' using errcode = '40001';
  end if;

  insert into public.evaluation_state_backups (revision, snapshot, label, created_by)
  values (v_current_revision, v_current_snapshot, '복구 전 자동 백업', p_actor_user_id);

  update public.evaluation_state
  set snapshot = v_snapshot, revision = revision + 1
  where id = 'primary'
  returning revision into v_next_revision;

  insert into public.audit_log (
    actor_user_id, actor_role, operation, target_id, revision, metadata
  ) values (
    p_actor_user_id, 'operator', 'state_restored', p_backup_id::text,
    v_next_revision, jsonb_build_object('restored_revision', v_backup_revision)
  );

  return v_next_revision;
end;
$$;

revoke all on function public.restore_evaluation_state_backup(uuid, bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.restore_evaluation_state_backup(uuid, bigint, uuid)
  to service_role;

with normalized as (
  select jsonb_agg(
    case
      when value->>'employeeCode' ~ '^3101[0-9]{4}$'
        then jsonb_set(value, '{employeeCode}', to_jsonb(right(value->>'employeeCode', 4)))
      else value
    end order by ordinal
  ) as engineers
  from public.evaluation_state,
    jsonb_array_elements(snapshot->'engineers') with ordinality as entries(value, ordinal)
  where id = 'primary'
)
update public.evaluation_state
set snapshot = jsonb_set(snapshot, '{engineers}', coalesce(normalized.engineers, '[]'::jsonb))
from normalized
where id = 'primary';

with normalized as (
  select jsonb_agg(
    case
      when value->>'employeeCode' ~ '^3101[0-9]{4}$'
        then jsonb_set(value, '{employeeCode}', to_jsonb(right(value->>'employeeCode', 4)))
      else value
    end order by ordinal
  ) as evaluators
  from public.evaluation_state,
    jsonb_array_elements(snapshot->'evaluators') with ordinality as entries(value, ordinal)
  where id = 'primary'
)
update public.evaluation_state
set snapshot = jsonb_set(snapshot, '{evaluators}', coalesce(normalized.evaluators, '[]'::jsonb))
from normalized
where id = 'primary';
