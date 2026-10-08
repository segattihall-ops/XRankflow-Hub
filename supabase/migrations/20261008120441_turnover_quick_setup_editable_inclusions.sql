alter table public.cleaning_turnover_requests add column if not exists extra_inclusions text[] not null default '{}'::text[];
alter table public.cleaning_turnover_quotes add column if not exists confirmed_inclusions text[] not null default '{}'::text[];
