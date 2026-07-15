create or replace function public.commit_evaluation_state(
  p_expected_revision bigint,
  p_snapshot jsonb,
  p_actor_user_id uuid,
  p_actor_role text,
  p_operation text,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_next_revision bigint;
begin
  update public.evaluation_state
  set
    snapshot = p_snapshot,
    revision = revision + 1
  where id = 'primary'
    and revision = p_expected_revision
  returning revision into v_next_revision;

  if v_next_revision is null then
    raise exception 'state_revision_conflict' using errcode = '40001';
  end if;

  insert into public.audit_log (
    actor_user_id,
    actor_role,
    operation,
    target_id,
    revision,
    metadata
  )
  values (
    p_actor_user_id,
    p_actor_role,
    p_operation,
    p_target_id,
    v_next_revision,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_next_revision;
end;
$$;

revoke all on function public.commit_evaluation_state(
  bigint,
  jsonb,
  uuid,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.commit_evaluation_state(
  bigint,
  jsonb,
  uuid,
  text,
  text,
  text,
  jsonb
) to service_role;
