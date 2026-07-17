update public.evaluation_state
set snapshot = jsonb_set(
  jsonb_set(
    jsonb_set(
      snapshot,
      '{schemaVersion}',
      '8'::jsonb,
      true
    ),
    '{derivedScoreRules}',
    coalesce(snapshot -> 'derivedScoreRules', '[]'::jsonb),
    true
  ),
  '{evaluationBenchmarks}',
  '[]'::jsonb,
  true
)
where id = 'primary'
  and coalesce((snapshot ->> 'schemaVersion')::integer, 0) < 8;
