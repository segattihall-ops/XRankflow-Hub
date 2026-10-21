
create table if not exists public.cleaning_vendors (
  id uuid primary key default gen_random_uuid(),
  source_quote_id uuid unique references public.cleaning_turnover_quotes(id) on delete set null,
  company_name text not null check (char_length(trim(company_name)) between 2 and 160),
  contact_name text,
  email text,
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en','pt','es')),
  status text not null default 'active' check (status in ('prospect','active','inactive')),
  default_rate numeric(10,2) check (default_rate is null or (default_rate > 0 and default_rate <= 100000)),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.airbnb_reservations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.cleaning_turnover_requests(id) on delete cascade,
  reservation_code text,
  guest_name text,
  guest_count integer check (guest_count is null or guest_count between 1 and 100),
  check_in_at timestamptz not null,
  check_out_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked','canceled','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out_at > check_in_at)
);

create table if not exists public.airbnb_turnovers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.cleaning_turnover_requests(id) on delete cascade,
  reservation_id uuid references public.airbnb_reservations(id) on delete set null,
  vendor_id uuid references public.cleaning_vendors(id) on delete set null,
  source_quote_id uuid references public.cleaning_turnover_quotes(id) on delete set null,
  scheduled_for timestamptz not null,
  checkout_at timestamptz,
  next_checkin_at timestamptz,
  status text not null default 'planned' check (
    status in ('planned','assigned','confirmed','in_progress','awaiting_review','completed','canceled')
  ),
  agreed_price numeric(10,2) check (agreed_price is null or (agreed_price > 0 and agreed_price <= 100000)),
  instructions text,
  completion_notes text,
  final_photo_urls text[] not null default '{}'::text[],
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.airbnb_turnover_messages (
  id uuid primary key default gen_random_uuid(),
  turnover_id uuid not null references public.airbnb_turnovers(id) on delete cascade,
  vendor_id uuid references public.cleaning_vendors(id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound','inbound','internal')),
  channel text not null default 'portal' check (channel in ('portal','email','sms','phone','other')),
  recipient text,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  status text not null default 'logged' check (status in ('draft','queued','logged','sent','delivered','failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.airbnb_turnover_payments (
  id uuid primary key default gen_random_uuid(),
  turnover_id uuid not null references public.airbnb_turnovers(id) on delete cascade,
  vendor_id uuid references public.cleaning_vendors(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0 and amount <= 100000),
  status text not null default 'pending' check (status in ('pending','approved','paid','hold','void','refunded')),
  method text,
  reference text,
  due_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cleaning_turnover_requests
  add column if not exists awarded_quote_id uuid references public.cleaning_turnover_quotes(id) on delete set null,
  add column if not exists awarded_vendor_id uuid references public.cleaning_vendors(id) on delete set null;

create index if not exists cleaning_vendors_status_idx
  on public.cleaning_vendors(status, created_at desc);
create index if not exists airbnb_reservations_request_checkout_idx
  on public.airbnb_reservations(request_id, check_out_at desc);
create index if not exists airbnb_turnovers_request_scheduled_idx
  on public.airbnb_turnovers(request_id, scheduled_for desc);
create index if not exists airbnb_turnovers_vendor_idx
  on public.airbnb_turnovers(vendor_id, scheduled_for desc);
create index if not exists airbnb_turnover_messages_turnover_idx
  on public.airbnb_turnover_messages(turnover_id, created_at desc);
create index if not exists airbnb_turnover_payments_status_idx
  on public.airbnb_turnover_payments(status, due_at);

alter table public.cleaning_vendors enable row level security;
alter table public.airbnb_reservations enable row level security;
alter table public.airbnb_turnovers enable row level security;
alter table public.airbnb_turnover_messages enable row level security;
alter table public.airbnb_turnover_payments enable row level security;

drop policy if exists cleaning_vendors_internal_all on public.cleaning_vendors;
create policy cleaning_vendors_internal_all
on public.cleaning_vendors
for all to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

drop policy if exists airbnb_reservations_internal_all on public.airbnb_reservations;
create policy airbnb_reservations_internal_all
on public.airbnb_reservations
for all to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

drop policy if exists airbnb_turnovers_internal_all on public.airbnb_turnovers;
create policy airbnb_turnovers_internal_all
on public.airbnb_turnovers
for all to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

drop policy if exists airbnb_turnover_messages_internal_all on public.airbnb_turnover_messages;
create policy airbnb_turnover_messages_internal_all
on public.airbnb_turnover_messages
for all to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

drop policy if exists airbnb_turnover_payments_internal_all on public.airbnb_turnover_payments;
create policy airbnb_turnover_payments_internal_all
on public.airbnb_turnover_payments
for all to authenticated
using (private.is_workhub_member())
with check (private.is_workhub_member());

revoke all on table public.cleaning_vendors from anon;
revoke all on table public.airbnb_reservations from anon;
revoke all on table public.airbnb_turnovers from anon;
revoke all on table public.airbnb_turnover_messages from anon;
revoke all on table public.airbnb_turnover_payments from anon;

grant select, insert, update, delete on table public.cleaning_vendors to authenticated;
grant select, insert, update, delete on table public.airbnb_reservations to authenticated;
grant select, insert, update, delete on table public.airbnb_turnovers to authenticated;
grant select, insert, update, delete on table public.airbnb_turnover_messages to authenticated;
grant select, insert, update, delete on table public.airbnb_turnover_payments to authenticated;
