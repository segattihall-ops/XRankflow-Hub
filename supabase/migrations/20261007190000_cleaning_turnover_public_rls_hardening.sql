
alter table public.cleaning_turnover_quotes
  drop constraint if exists cleaning_turnover_quotes_contact_required,
  drop constraint if exists cleaning_turnover_quotes_all_inclusive_required;

alter table public.cleaning_turnover_quotes
  add constraint cleaning_turnover_quotes_contact_required
    check (nullif(trim(coalesce(email, '')), '') is not null or nullif(trim(coalesce(phone, '')), '') is not null),
  add constraint cleaning_turnover_quotes_all_inclusive_required
    check (
      includes_cleaning_supplies
      and includes_laundry
      and includes_paper_towels
      and includes_toilet_paper
    );

revoke execute on function public.cleaning_turnover_public_request(uuid) from anon, authenticated;
revoke execute on function public.submit_cleaning_turnover_quote(
  uuid, text, text, text, text, numeric, boolean, boolean, boolean, boolean, numeric, integer, text, text
) from anon, authenticated;

drop function if exists public.cleaning_turnover_public_request(uuid);
drop function if exists public.submit_cleaning_turnover_quote(
  uuid, text, text, text, text, numeric, boolean, boolean, boolean, boolean, numeric, integer, text, text
);

grant select on table public.cleaning_turnover_requests to anon;
grant insert on table public.cleaning_turnover_quotes to anon;

drop policy if exists cleaning_turnover_requests_public_token_select on public.cleaning_turnover_requests;
create policy cleaning_turnover_requests_public_token_select
on public.cleaning_turnover_requests
for select
to anon
using (
  status = 'open'
  and public_token::text =
    coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-turnover-token'
);

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
  and exists (
    select 1
    from public.cleaning_turnover_requests r
    where r.id = request_id
      and r.status = 'open'
      and r.public_token::text =
        coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-turnover-token'
  )
);
