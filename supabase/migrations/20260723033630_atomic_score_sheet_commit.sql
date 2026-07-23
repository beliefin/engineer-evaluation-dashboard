create or replace function public.commit_evaluation_sheet(
  p_sheet_id text,
  p_sheet jsonb,
  p_audit_event jsonb,
  p_actor_user_id uuid,
  p_actor_role text,
  p_operation text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_current_sheet jsonb;
  v_next_revision bigint;
begin
  if jsonb_typeof(p_sheet) <> 'object'
    or p_sheet ->> 'id' is distinct from p_sheet_id then
    raise exception 'invalid_score_sheet' using errcode = '22023';
  end if;

  select snapshot
  into v_snapshot
  from public.evaluation_state
  where id = 'primary'
  for update;

  if v_snapshot is null then
    raise exception 'evaluation_state_not_found' using errcode = 'P0002';
  end if;

  select sheet
  into v_current_sheet
  from jsonb_array_elements(coalesce(v_snapshot -> 'scoreSheets', '[]'::jsonb)) as sheets(sheet)
  where sheet ->> 'id' = p_sheet_id;

  if v_current_sheet is null then
    raise exception 'score_sheet_not_found' using errcode = 'P0002';
  end if;

  if p_actor_role <> 'operator'
    and v_current_sheet ->> 'status' = 'submitted' then
    raise exception 'score_sheet_locked' using errcode = '55000';
  end if;

  v_snapshot := jsonb_set(
    v_snapshot,
    '{scoreSheets}',
    (
      select jsonb_agg(
        case when entry ->> 'id' = p_sheet_id then p_sheet else entry end
        order by position
      )
      from jsonb_array_elements(coalesce(v_snapshot -> 'scoreSheets', '[]'::jsonb))
        with ordinality as sheets(entry, position)
    ),
    false
  );

  if p_audit_event is not null then
    v_snapshot := jsonb_set(
      v_snapshot,
      '{auditEvents}',
      coalesce(v_snapshot -> 'auditEvents', '[]'::jsonb) || jsonb_build_array(p_audit_event),
      true
    );
  end if;

  update public.evaluation_state
  set
    snapshot = v_snapshot,
    revision = revision + 1
  where id = 'primary'
  returning revision into v_next_revision;

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
    p_sheet_id,
    v_next_revision,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return jsonb_build_object(
    'snapshot', v_snapshot,
    'revision', v_next_revision
  );
end;
$$;

revoke all on function public.commit_evaluation_sheet(
  text,
  jsonb,
  jsonb,
  uuid,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.commit_evaluation_sheet(
  text,
  jsonb,
  jsonb,
  uuid,
  text,
  text,
  jsonb
) to service_role;
