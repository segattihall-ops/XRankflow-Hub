
alter table public.cleaning_turnover_requests
  add column if not exists airbnb_url text;

alter table public.cleaning_turnover_requests
  drop constraint if exists cleaning_turnover_requests_airbnb_url_check;

alter table public.cleaning_turnover_requests
  add constraint cleaning_turnover_requests_airbnb_url_check
  check (
    airbnb_url is null
    or (
      char_length(airbnb_url) <= 1200
      and airbnb_url ~ '^https://'
    )
  );

insert into public.cleaning_turnover_requests (
  property_name,
  airbnb_url,
  bedrooms,
  bathrooms,
  turnover_notes,
  status
)
select
  'Airbnb #1750221672127428210',
  'https://www.airbnb.com/rooms/1750221672127428210?unique_share_id=fa28d01c-9d0a-4539-b0cc-1df7e59b77cb&viralityEntryPoint=1&s=76',
  3,
  2,
  '3 bedrooms and 2 bathrooms. One bedroom also functions as an office and has a sofa bed. Quote a complete Airbnb turnover. Property photos will be uploaded separately.',
  'open'
where not exists (
  select 1
  from public.cleaning_turnover_requests
  where airbnb_url like 'https://www.airbnb.com/rooms/1750221672127428210%'
);
