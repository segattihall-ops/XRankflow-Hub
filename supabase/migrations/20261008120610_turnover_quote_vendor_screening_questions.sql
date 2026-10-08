alter table public.cleaning_turnover_quotes
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
