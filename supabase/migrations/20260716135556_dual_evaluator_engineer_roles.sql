alter table public.profiles
  add column roles text[];

update public.profiles
set roles = array[role];

alter table public.profiles
  alter column roles set not null;

alter table public.profiles
  drop constraint profiles_role_link;

alter table public.profiles
  add constraint profiles_roles check (
    (cardinality(roles) = 1 and roles[1] = role)
    or (roles = array['evaluator', 'engineer']::text[] and role = 'evaluator')
  ),
  add constraint profiles_role_link check (
    ('evaluator' = any(roles)) = (evaluator_id is not null)
    and ('engineer' = any(roles)) = (engineer_id is not null)
  );

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
        and 'operator' = any(roles)
        and active
    );
$$;

revoke execute on function private.is_operator() from public, anon, authenticated, service_role;
grant execute on function private.is_operator() to authenticated;
