alter table public.profiles
  add column can_view_insights boolean not null default false;

alter table public.profiles
  add constraint profiles_insights_requires_evaluator check (
    not can_view_insights or 'evaluator' = any(roles)
  );

update public.profiles
set can_view_insights = true
where username in ('박경철', '박상홍', '박주현')
  and 'evaluator' = any(roles);
