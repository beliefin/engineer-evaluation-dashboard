create policy evaluation_state_deny_authenticated
on public.evaluation_state
for all
to authenticated
using (false)
with check (false);

create policy audit_log_deny_authenticated
on public.audit_log
for all
to authenticated
using (false)
with check (false);
