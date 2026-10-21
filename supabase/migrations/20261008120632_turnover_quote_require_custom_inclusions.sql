drop policy if exists cleaning_turnover_quotes_public_token_insert on public.cleaning_turnover_quotes;
create policy cleaning_turnover_quotes_public_token_insert
on public.cleaning_turnover_quotes
for insert to anon
with check (
  includes_cleaning_supplies and includes_laundry and
  includes_paper_towels and includes_toilet_paper
  and exists (
    select 1 from public.cleaning_turnover_requests r
    where r.id = request_id and r.status = 'open'
      and r.public_token::text =
        coalesce(current_setting('request.headers', true), '{}')::jsonb ->> 'x-turnover-token'
      and r.extra_inclusions <@ confirmed_inclusions
  )
);
