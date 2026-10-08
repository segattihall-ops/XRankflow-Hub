alter table public.cleaning_turnover_requests
  add column if not exists extra_inclusions text[] not null default '{}'::text[];
alter table public.cleaning_turnover_quotes
  add column if not exists confirmed_inclusions text[] not null default '{}'::text[],
  add column if not exists minimum_notice_hours integer
    check (minimum_notice_hours between 0 and 720),
  add column if not exists same_day_turnover boolean,
  add column if not exists equipment_details text,
  add column if not exists laundry_method text
    check (laundry_method in ('on_site','off_site','both')),
  add column if not exists laundry_process text,
  add column if not exists years_experience integer
    check (years_experience between 0 and 70),
  add column if not exists has_insurance boolean,
  add column if not exists completion_photos_agreed boolean;

alter table public.cleaning_turnover_requests
  drop constraint if exists cleaning_turnover_extra_inclusions_limit;
alter table public.cleaning_turnover_requests
  add constraint cleaning_turnover_extra_inclusions_limit
  check (cardinality(extra_inclusions) <= 12 and array_position(extra_inclusions, null) is null);

alter table public.cleaning_turnover_quotes
  drop constraint if exists cleaning_turnover_quote_confirmed_inclusions_limit;
alter table public.cleaning_turnover_quotes
  add constraint cleaning_turnover_quote_confirmed_inclusions_limit
  check (cardinality(confirmed_inclusions) <= 16 and array_position(confirmed_inclusions, null) is null);

drop policy if exists cleaning_turnover_quotes_public_token_insert on public.cleaning_turnover_quotes;
create policy cleaning_turnover_quotes_public_token_insert
on public.cleaning_turnover_quotes
for insert to anon
with check (
  includes_cleaning_supplies
  and includes_laundry
  and includes_paper_towels
  and includes_toilet_paper
  and exists (
    select 1 from public.cleaning_turnover_requests r
    where r.id = request_id
      and r.status = 'open'
      and r.public_token::text =
        coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-turnover-token'
      and r.extra_inclusions <@ confirmed_inclusions
  )
);
