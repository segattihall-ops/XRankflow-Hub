alter table public.xrmg_automation_registry
  add column if not exists source_system text not null default 'manual',
  add column if not exists source_external_id text,
  add column if not exists source_enabled boolean,
  add column if not exists schedule_ical text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_status text not null default 'UNVERIFIED'
    check (sync_status in ('VERIFIED','STALE','UNVERIFIED','ERROR')),
  add column if not exists priority text not null default 'P2'
    check (priority in ('P0','P1','P2','P3')),
  add column if not exists automation_level integer not null default 1
    check (automation_level between 1 and 4),
  add column if not exists frequency text,
  add column if not exists risk_level text not null default 'medium'
    check (risk_level in ('low','medium','high','critical')),
  add column if not exists estimated_minutes_saved_per_run numeric(10,2) not null default 0,
  add column if not exists estimated_manual_actions_removed_per_run integer not null default 0,
  add column if not exists automation_score numeric(12,2);

create unique index if not exists xrmg_automation_registry_source_external_uidx
  on public.xrmg_automation_registry(source_system, source_external_id)
  where source_external_id is not null;

create table if not exists public.xrmg_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_key text not null references public.xrmg_automation_registry(automation_key) on update cascade,
  external_run_id text,
  idempotency_key text not null unique,
  status text not null check (status in ('SUCCESS','FAILED','PARTIAL','RETRYING','BLOCKED','HUMAN_REVIEW')),
  attempt integer not null default 1 check (attempt > 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  trigger_event jsonb not null default '{}'::jsonb,
  input_ref jsonb not null default '{}'::jsonb,
  output_ref jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  minutes_saved numeric(10,2) not null default 0,
  manual_actions_removed integer not null default 0,
  revenue_impact numeric(14,2) not null default 0,
  cost_reduction numeric(14,2) not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists xrmg_automation_runs_automation_started_idx
  on public.xrmg_automation_runs (automation_key, started_at desc);

create index if not exists xrmg_automation_runs_status_started_idx
  on public.xrmg_automation_runs (status, started_at desc);

alter table public.xrmg_automation_registry enable row level security;
alter table public.xrmg_automation_runs enable row level security;
alter table public.xrmg_incident_register enable row level security;

grant select on table public.xrmg_automation_registry to authenticated;
grant select on table public.xrmg_automation_runs to authenticated;
grant select on table public.xrmg_incident_register to authenticated;

drop policy if exists xrmg_automation_registry_select_workhub on public.xrmg_automation_registry;
create policy xrmg_automation_registry_select_workhub
  on public.xrmg_automation_registry
  for select to authenticated
  using (private.is_workhub_member());

drop policy if exists xrmg_automation_runs_select_workhub on public.xrmg_automation_runs;
create policy xrmg_automation_runs_select_workhub
  on public.xrmg_automation_runs
  for select to authenticated
  using (private.is_workhub_member());

drop policy if exists xrmg_incident_register_select_workhub on public.xrmg_incident_register;
create policy xrmg_incident_register_select_workhub
  on public.xrmg_incident_register
  for select to authenticated
  using (private.is_workhub_member());

create or replace view public.xrmg_automation_effectiveness
with (security_invoker = true)
as
select
  r.automation_key,
  r.name,
  r.company_key,
  r.status,
  r.priority,
  r.automation_level,
  r.risk_level,
  r.source_system,
  r.source_external_id,
  r.source_enabled,
  r.sync_status,
  r.last_synced_at,
  count(run.id) as run_count,
  count(run.id) filter (where run.status = 'SUCCESS') as success_count,
  count(run.id) filter (where run.status = 'FAILED') as failure_count,
  coalesce(round(
    100.0 * count(run.id) filter (where run.status = 'SUCCESS')
    / nullif(count(run.id), 0), 2
  ), 0) as success_rate,
  coalesce(sum(run.minutes_saved), 0) as minutes_saved,
  coalesce(sum(run.manual_actions_removed), 0) as manual_actions_removed,
  coalesce(sum(run.revenue_impact), 0) as revenue_impact,
  coalesce(sum(run.cost_reduction), 0) as cost_reduction,
  max(run.started_at) as last_observed_run_at
from public.xrmg_automation_registry r
left join public.xrmg_automation_runs run
  on run.automation_key = r.automation_key
group by
  r.automation_key, r.name, r.company_key, r.status, r.priority,
  r.automation_level, r.risk_level, r.source_system,
  r.source_external_id, r.source_enabled, r.sync_status, r.last_synced_at;

grant select on public.xrmg_automation_effectiveness to authenticated;
