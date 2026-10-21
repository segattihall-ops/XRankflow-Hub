-- Social Media OS metrics persistence applied to production Supabase on 2026-10-01.

alter table public.sm_metrics
  add column if not exists source text not null default 'buffer',
  add column if not exists metrics_updated_at timestamptz,
  add column if not exists collected_at timestamptz not null default now();

create table if not exists public.sm_metric_syncs (
  queue_id uuid primary key references public.sm_queue(id) on delete cascade,
  content_id uuid not null references public.sm_content(id) on delete cascade,
  brand_id uuid not null references public.sm_brands(id) on delete cascade,
  provider text not null default 'buffer',
  status text not null default 'pending'
    check (status in ('pending','observed','no_data','error')),
  metrics_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  last_error text,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists sm_metric_syncs_brand_status
  on public.sm_metric_syncs(brand_id,status,last_synced_at desc);

alter table public.sm_metrics enable row level security;
alter table public.sm_metric_syncs enable row level security;

revoke all on table public.sm_metrics from anon, authenticated;
revoke all on table public.sm_metric_syncs from anon, authenticated;
grant select on table public.sm_metrics to authenticated;
grant select on table public.sm_metric_syncs to authenticated;

drop policy if exists sm_metrics_read on public.sm_metrics;
create policy sm_metrics_read
on public.sm_metrics
for select
to authenticated
using (private.sm_brand_ok(brand_id));

drop policy if exists sm_metric_syncs_read on public.sm_metric_syncs;
create policy sm_metric_syncs_read
on public.sm_metric_syncs
for select
to authenticated
using (private.sm_brand_ok(brand_id));
