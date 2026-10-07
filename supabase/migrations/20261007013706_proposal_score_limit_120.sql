alter table public.evaluation_state add constraint evaluation_state_direct_score_range check (
  not jsonb_path_exists(
    snapshot,
    '$.directScores[*] ? (@.score != null && (@.score.type() != "number" || @.score < 0 || @.score > 120 || (@.score > 100 && !(@.taskId == $proposalIds[*]))))',
    jsonb_build_object('proposalIds', jsonb_path_query_array(
      snapshot,
      '$.tasks[*] ? (@.method == "operator_score" && @.name like_regex "고\\s*등\\s*급\\s*제\\s*안").id'
    ))
  )
);
