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

-- Property photos for the Airbnb listing (taken from the public listing).
update public.cleaning_turnover_requests
set photo_urls = array[
  'https://a0.muscache.com/im/pictures/hosting/Hosting-1750221672127428210/original/607038d5-9644-4a39-997e-4a119ed92deb.png',
  'https://a0.muscache.com/im/pictures/hosting/Hosting-1750221672127428210/original/a440fe58-d6b2-4857-b99a-232724d1aa20.png',
  'https://a0.muscache.com/im/pictures/hosting/Hosting-1750221672127428210/original/5ccc00fb-3c23-4535-afbc-b80035c00ce6.png',
  'https://a0.muscache.com/im/pictures/hosting/Hosting-1750221672127428210/original/fd313079-cc3e-47d6-9b13-cfe5e7fae667.png',
  'https://a0.muscache.com/im/pictures/hosting/Hosting-1750221672127428210/original/59be6465-51df-4fec-a017-61f4c4fc950c.png'
]::text[],
  updated_at = now()
where airbnb_url like 'https://www.airbnb.com/rooms/1750221672127428210%'
  and cardinality(photo_urls) = 0;
