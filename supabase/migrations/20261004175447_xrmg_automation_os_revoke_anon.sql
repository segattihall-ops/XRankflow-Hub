revoke all on table public.xrmg_automation_runs from anon;
revoke all on table public.xrmg_automation_registry from anon;
revoke all on table public.xrmg_incident_register from anon;
revoke all on table public.xrmg_automation_effectiveness from anon;

grant select on table public.xrmg_automation_registry to authenticated;
grant select on table public.xrmg_automation_runs to authenticated;
grant select on table public.xrmg_incident_register to authenticated;
grant select on table public.xrmg_automation_effectiveness to authenticated;
