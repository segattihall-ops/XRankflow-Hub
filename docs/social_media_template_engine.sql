-- Social Media Template Engine
-- Applied to Supabase project njwqeulzythluenexdcw on 2026-09-30.
-- This file documents the live schema changes for source control.

create table if not exists public.sm_templates (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.sm_brands(id) on delete cascade,
  name text not null,
  provider text not null default 'canva' check (provider in ('canva','internal','other')),
  source_type text not null default 'design_page' check (source_type in ('design_page','brand_template')),
  source_design_id text,
  source_page_number integer,
  source_brand_template_id text,
  platforms text[] not null default '{}'::text[],
  formats text[] not null default '{}'::text[],
  width integer,
  height integer,
  aspect_ratio text,
  language_tags text[] not null default '{}'::text[],
  audience_tags text[] not null default '{}'::text[],
  objective_tags text[] not null default '{}'::text[],
  field_schema jsonb not null default '{}'::jsonb,
  selection_rules jsonb not null default '{}'::jsonb,
  capability text not null default 'copy_manual' check (capability in ('copy_manual','autofill')),
  priority integer not null default 100,
  status text not null default 'active' check (status in ('active','paused','reference','archived')),
  source_edit_url text,
  source_view_url text,
  external_meta jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, provider, source_design_id, source_page_number)
);

create table if not exists public.sm_template_renders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.sm_brands(id) on delete cascade,
  content_id uuid not null references public.sm_content(id) on delete cascade,
  template_id uuid not null references public.sm_templates(id) on delete restrict,
  provider text not null default 'canva',
  status text not null default 'queued' check (
    status in ('queued','preparing','ready','manual_edit_required','external_blocked','failed','cancelled')
  ),
  external_design_id text,
  external_job_id text,
  edit_url text,
  view_url text,
  payload jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sm_content
  add column if not exists template_id uuid references public.sm_templates(id) on delete set null,
  add column if not exists template_status text not null default 'unassigned',
  add column if not exists creative_provider text,
  add column if not exists creative_design_id text,
  add column if not exists creative_edit_url text,
  add column if not exists creative_view_url text;

create index if not exists sm_templates_brand_status on public.sm_templates(brand_id, status);
create index if not exists sm_templates_selection on public.sm_templates(brand_id, priority);
create index if not exists sm_template_renders_content on public.sm_template_renders(content_id, created_at desc);
create unique index if not exists sm_template_renders_active_once
  on public.sm_template_renders(content_id, template_id)
  where status in ('queued','preparing','ready','manual_edit_required','external_blocked');

alter table public.sm_templates enable row level security;
alter table public.sm_template_renders enable row level security;

revoke all on table public.sm_templates from anon, authenticated;
revoke all on table public.sm_template_renders from anon, authenticated;
grant select, insert, update, delete on table public.sm_templates to authenticated;
grant select, insert, update, delete on table public.sm_template_renders to authenticated;

drop policy if exists sm_templates_select on public.sm_templates;
create policy sm_templates_select on public.sm_templates
for select to authenticated
using (private.sm_brand_ok(brand_id));

drop policy if exists sm_templates_insert on public.sm_templates;
create policy sm_templates_insert on public.sm_templates
for insert to authenticated
with check (private.sm_can_edit(brand_id));

drop policy if exists sm_templates_update on public.sm_templates;
create policy sm_templates_update on public.sm_templates
for update to authenticated
using (private.sm_can_edit(brand_id))
with check (private.sm_can_edit(brand_id));

drop policy if exists sm_templates_delete on public.sm_templates;
create policy sm_templates_delete on public.sm_templates
for delete to authenticated
using (private.sm_can_edit(brand_id));

drop policy if exists sm_template_renders_select on public.sm_template_renders;
create policy sm_template_renders_select on public.sm_template_renders
for select to authenticated
using (private.sm_brand_ok(brand_id));

drop policy if exists sm_template_renders_insert on public.sm_template_renders;
create policy sm_template_renders_insert on public.sm_template_renders
for insert to authenticated
with check (private.sm_can_edit(brand_id));

drop policy if exists sm_template_renders_update on public.sm_template_renders;
create policy sm_template_renders_update on public.sm_template_renders
for update to authenticated
using (private.sm_can_edit(brand_id))
with check (private.sm_can_edit(brand_id));

drop policy if exists sm_template_renders_delete on public.sm_template_renders;
create policy sm_template_renders_delete on public.sm_template_renders
for delete to authenticated
using (private.sm_can_edit(brand_id));
