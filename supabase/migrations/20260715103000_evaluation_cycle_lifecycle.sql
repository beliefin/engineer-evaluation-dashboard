update public.evaluation_state
set snapshot = jsonb_set(
  jsonb_set(
    snapshot,
    '{cycles}',
    coalesce(
      (
        select jsonb_agg(
          case
            when cycle ? 'locked' then cycle
            else cycle || jsonb_build_object('locked', false)
          end
          order by cycle->>'id'
        )
        from jsonb_array_elements(snapshot->'cycles') as cycle
      ),
      '[]'::jsonb
    )
  ),
  '{directScoreRules}',
  coalesce(snapshot->'directScoreRules', '[]'::jsonb),
  true
)
where id = 'primary'
  and jsonb_typeof(snapshot->'cycles') = 'array';
