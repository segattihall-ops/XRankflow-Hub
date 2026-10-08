-- Expand the public turnover quote form so every bid covers the full Airbnb
-- turnover consumables and logistics, and capture cleaner profile details.

alter table public.cleaning_turnover_quotes
  add column if not exists includes_trash_removal boolean not null default false,
  add column if not exists includes_kitchen_supplies boolean not null default false,
  add column if not exists includes_bathroom_supplies boolean not null default false,
  add column if not exists includes_equipment_transport boolean not null default false,
  add column if not exists cleaner_type text,
  add column if not exists service_area text,
  add column if not exists years_experience integer,
  add column if not exists has_insurance boolean,
  add column if not exists same_day_available boolean;

alter table public.cleaning_turnover_quotes
  drop constraint if exists cleaning_turnover_quotes_cleaner_type_check,
  add constraint cleaning_turnover_quotes_cleaner_type_check
    check (cleaner_type is null or cleaner_type in ('business', 'individual')),
  drop constraint if exists cleaning_turnover_quotes_service_area_check,
  add constraint cleaning_turnover_quotes_service_area_check
    check (service_area is null or char_length(trim(service_area)) between 2 and 160),
  drop constraint if exists cleaning_turnover_quotes_years_experience_check,
  add constraint cleaning_turnover_quotes_years_experience_check
    check (years_experience is null or years_experience between 0 and 80);

-- NOT VALID: quotes submitted before this migration only have the original four
-- inclusions, so adding the constraint does not re-check them. New inserts must
-- satisfy the full list, and any future edit to an old row must also satisfy it.
alter table public.cleaning_turnover_quotes
  drop constraint if exists cleaning_turnover_quotes_all_inclusive_required;

alter table public.cleaning_turnover_quotes
  add constraint cleaning_turnover_quotes_all_inclusive_required
  check (
    includes_cleaning_supplies
    and includes_laundry
    and includes_paper_towels
    and includes_toilet_paper
    and includes_trash_removal
    and includes_kitchen_supplies
    and includes_bathroom_supplies
    and includes_equipment_transport
  ) not valid;

drop policy if exists cleaning_turnover_quotes_public_token_insert on public.cleaning_turnover_quotes;
create policy cleaning_turnover_quotes_public_token_insert
on public.cleaning_turnover_quotes
for insert
to anon
with check (
  includes_cleaning_supplies
  and includes_laundry
  and includes_paper_towels
  and includes_toilet_paper
  and includes_trash_removal
  and includes_kitchen_supplies
  and includes_bathroom_supplies
  and includes_equipment_transport
  and exists (
    select 1
    from public.cleaning_turnover_requests r
    where r.id = request_id
      and r.status = 'open'
      and r.public_token::text =
        coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-turnover-token'
  )
);
