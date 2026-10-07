create table if not exists public.cleaning_turnover_requests (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  property_name text not null check (char_length(trim(property_name)) between 2 and 160),
  property_address text,
  bedrooms numeric(4,1),
  bathrooms numeric(4,1),
  turnover_date date,
  turnover_notes text,
  photo_urls text[] not null default '{}'::text[],
  status text not null default 'open' check (status in ('open','closed','awarded')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_turnover_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.cleaning_turnover_requests(id) on delete cascade,
  company_name text not null check (char_length(trim(company_name)) between 2 and 160),
  contact_name text,
  email text,
  phone text,
  total_price numeric(10,2) not null check (total_price > 0 and total_price <= 100000),
  currency text not null default 'USD' check (currency = 'USD'),
  includes_cleaning_supplies boolean not null,
  includes_laundry boolean not null,
  includes_paper_towels boolean not null,
  includes_toilet_paper boolean not null,
  estimated_hours numeric(6,2),
  team_size integer check (team_size is null or (team_size >= 1 and team_size <= 50)),
  availability_notes text,
  notes text,
  submitted_at timestamptz not null default now()
);

create index if not exists cleaning_turnover_requests_status_idx
  on public.cleaning_turnover_requests(status, created_at desc);

create index if not exists cleaning_turnover_quotes_request_idx
  on public.cleaning_turnover_quotes(request_id, submitted_at desc);

alter table public.cleaning_turnover_requests enable row level security;
alter table public.cleaning_turnover_quotes enable row level security;

drop policy if exists cleaning_turnover_requests_internal_all on public.cleaning_turnover_requests;
create policy cleaning_turnover_requests_internal_all
on public.cleaning_turnover_requests
for all
to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

drop policy if exists cleaning_turnover_quotes_internal_all on public.cleaning_turnover_quotes;
create policy cleaning_turnover_quotes_internal_all
on public.cleaning_turnover_quotes
for all
to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

revoke all on table public.cleaning_turnover_requests from anon;
revoke all on table public.cleaning_turnover_quotes from anon;
grant select, insert, update, delete on table public.cleaning_turnover_requests to authenticated;
grant select, insert, update, delete on table public.cleaning_turnover_quotes to authenticated;

create or replace function public.cleaning_turnover_public_request(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', r.id,
    'property_name', r.property_name,
    'property_address', r.property_address,
    'bedrooms', r.bedrooms,
    'bathrooms', r.bathrooms,
    'turnover_date', r.turnover_date,
    'turnover_notes', r.turnover_notes,
    'photo_urls', r.photo_urls,
    'status', r.status,
    'required_inclusions', jsonb_build_array(
      'Cleaning supplies and materials',
      'Laundry',
      'Paper towels',
      'Toilet paper'
    )
  )
  from public.cleaning_turnover_requests r
  where r.public_token = p_token
    and r.status = 'open'
  limit 1
$$;

create or replace function public.submit_cleaning_turnover_quote(
  p_token uuid,
  p_company_name text,
  p_contact_name text default null,
  p_email text default null,
  p_phone text default null,
  p_total_price numeric default null,
  p_includes_cleaning_supplies boolean default false,
  p_includes_laundry boolean default false,
  p_includes_paper_towels boolean default false,
  p_includes_toilet_paper boolean default false,
  p_estimated_hours numeric default null,
  p_team_size integer default null,
  p_availability_notes text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request_id uuid;
  v_quote_id uuid;
  v_submitted_at timestamptz;
  v_company text := left(trim(coalesce(p_company_name, '')), 160);
  v_email text := nullif(left(trim(coalesce(p_email, '')), 240), '');
  v_phone text := nullif(left(trim(coalesce(p_phone, '')), 80), '');
begin
  if p_token is null then
    raise exception 'invalid_token';
  end if;

  select id into v_request_id
  from public.cleaning_turnover_requests
  where public_token = p_token
    and status = 'open'
  limit 1;

  if v_request_id is null then raise exception 'request_not_found_or_closed'; end if;
  if char_length(v_company) < 2 then raise exception 'company_name_required'; end if;
  if v_email is null and v_phone is null then raise exception 'contact_required'; end if;
  if p_total_price is null or p_total_price <= 0 or p_total_price > 100000 then raise exception 'invalid_total_price'; end if;

  if not coalesce(p_includes_cleaning_supplies, false)
     or not coalesce(p_includes_laundry, false)
     or not coalesce(p_includes_paper_towels, false)
     or not coalesce(p_includes_toilet_paper, false) then
    raise exception 'all_required_inclusions_must_be_in_total';
  end if;

  if p_estimated_hours is not null and (p_estimated_hours <= 0 or p_estimated_hours > 168) then
    raise exception 'invalid_estimated_hours';
  end if;
  if p_team_size is not null and (p_team_size < 1 or p_team_size > 50) then
    raise exception 'invalid_team_size';
  end if;

  insert into public.cleaning_turnover_quotes (
    request_id, company_name, contact_name, email, phone, total_price,
    includes_cleaning_supplies, includes_laundry, includes_paper_towels,
    includes_toilet_paper, estimated_hours, team_size, availability_notes, notes
  ) values (
    v_request_id, v_company,
    nullif(left(trim(coalesce(p_contact_name, '')), 160), ''),
    v_email, v_phone, round(p_total_price, 2),
    true, true, true, true,
    p_estimated_hours, p_team_size,
    nullif(left(trim(coalesce(p_availability_notes, '')), 1200), ''),
    nullif(left(trim(coalesce(p_notes, '')), 3000), '')
  )
  returning id, submitted_at into v_quote_id, v_submitted_at;

  return jsonb_build_object('id', v_quote_id, 'request_id', v_request_id, 'submitted_at', v_submitted_at);
end;
$$;

revoke all on function public.cleaning_turnover_public_request(uuid) from public;
grant execute on function public.cleaning_turnover_public_request(uuid) to anon, authenticated;

revoke all on function public.submit_cleaning_turnover_quote(
  uuid, text, text, text, text, numeric, boolean, boolean, boolean, boolean, numeric, integer, text, text
) from public;
grant execute on function public.submit_cleaning_turnover_quote(
  uuid, text, text, text, text, numeric, boolean, boolean, boolean, boolean, numeric, integer, text, text
) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cleaning-turnover-photos',
  'cleaning-turnover-photos',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists cleaning_turnover_photos_insert on storage.objects;
create policy cleaning_turnover_photos_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'cleaning-turnover-photos' and private.is_workhub_member());

drop policy if exists cleaning_turnover_photos_select on storage.objects;
create policy cleaning_turnover_photos_select
on storage.objects for select to authenticated
using (bucket_id = 'cleaning-turnover-photos' and private.is_workhub_member());

drop policy if exists cleaning_turnover_photos_delete on storage.objects;
create policy cleaning_turnover_photos_delete
on storage.objects for delete to authenticated
using (bucket_id = 'cleaning-turnover-photos' and private.is_workhub_member());
