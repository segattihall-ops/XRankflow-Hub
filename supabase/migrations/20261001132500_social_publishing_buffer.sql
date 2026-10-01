-- Social Media OS: provider-agnostic publishing queue + Buffer adapter support
-- Applied to production Supabase on 2026-10-01.

alter table public.sm_accounts
  add column if not exists provider text not null default 'buffer',
  add column if not exists provider_channel_id text,
  add column if not exists provider_meta jsonb not null default '{}'::jsonb;

update public.sm_accounts
set provider_channel_id = buffer_channel_id
where provider='buffer'
  and provider_channel_id is null
  and buffer_channel_id is not null;

create unique index if not exists sm_accounts_provider_channel_unique
  on public.sm_accounts(provider, provider_channel_id)
  where provider_channel_id is not null;

create or replace function public.sm_enqueue_content(
  p_content_id uuid,
  p_account_id uuid,
  p_due_at timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  v_content public.sm_content%rowtype;
  v_account public.sm_accounts%rowtype;
  v_brand public.sm_brands%rowtype;
  v_due timestamptz;
  v_key text;
  v_queue_id uuid;
begin
  select * into v_content from public.sm_content where id=p_content_id;
  if not found then raise exception 'content_not_found'; end if;
  if not private.sm_can_edit(v_content.brand_id) then raise exception 'not_allowed'; end if;
  if v_content.status not in ('aprovado','agendado') then raise exception 'content_not_approved'; end if;

  select * into v_account from public.sm_accounts where id=p_account_id;
  if not found then raise exception 'account_not_found'; end if;
  if v_account.brand_id <> v_content.brand_id then raise exception 'brand_mismatch'; end if;
  if v_account.platform <> v_content.platform then raise exception 'platform_mismatch'; end if;
  if v_account.status <> 'conectada' or v_account.paused then raise exception 'account_unavailable'; end if;
  if v_account.provider_channel_id is null and v_account.buffer_channel_id is null then raise exception 'provider_channel_missing'; end if;

  select * into v_brand from public.sm_brands where id=v_content.brand_id;
  if v_brand.paused then raise exception 'brand_paused'; end if;

  if v_content.campaign_id is not null and exists (
    select 1 from public.sm_campaigns c where c.id=v_content.campaign_id and c.paused
  ) then raise exception 'campaign_paused'; end if;

  v_due := coalesce(p_due_at, v_content.scheduled_for, now());
  if v_due < now() - interval '1 minute' then raise exception 'due_at_in_past'; end if;

  v_key := concat_ws(
    ':',
    v_content.id::text,
    v_content.version::text,
    v_account.id::text,
    to_char(v_due at time zone 'utc','YYYYMMDDHH24MISS')
  );

  insert into public.sm_queue(
    content_id, brand_id, account_id, version, idempotency_key,
    due_at, status, max_attempts, dispatch_snapshot
  ) values (
    v_content.id,
    v_content.brand_id,
    v_account.id,
    v_content.version,
    v_key,
    v_due,
    'pendente',
    5,
    jsonb_build_object(
      'platform',v_content.platform,
      'provider',coalesce(v_account.provider,'buffer'),
      'provider_channel_id',coalesce(v_account.provider_channel_id,v_account.buffer_channel_id),
      'caption',v_content.caption,
      'creative_view_url',v_content.creative_view_url,
      'final_url',v_content.final_url,
      'scheduled_for',v_due
    )
  )
  on conflict (idempotency_key) do update set updated_at=now()
  returning id into v_queue_id;

  update public.sm_content
  set status='agendado', scheduled_for=v_due, updated_at=now()
  where id=v_content.id;

  return v_queue_id;
end;
$$;

create or replace function public.sm_claim_queue(p_queue_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  q public.sm_queue%rowtype;
  c public.sm_content%rowtype;
  a public.sm_accounts%rowtype;
  attempt_no integer;
begin
  select * into q from public.sm_queue where id=p_queue_id for update;
  if not found then raise exception 'queue_not_found'; end if;
  if not private.sm_can_edit(q.brand_id) then raise exception 'not_allowed'; end if;
  if q.status not in ('pendente','falhou','incerto') then raise exception 'queue_not_claimable'; end if;
  if q.attempts >= q.max_attempts then raise exception 'max_attempts_reached'; end if;

  select * into c from public.sm_content where id=q.content_id;
  select * into a from public.sm_accounts where id=q.account_id;

  attempt_no := q.attempts + 1;

  update public.sm_queue
  set status='processando', attempts=attempt_no, locked_at=now(), updated_at=now()
  where id=q.id;

  insert into public.sm_publish_attempts(queue_id,brand_id,attempt_no,outcome,detail)
  values(
    q.id,
    q.brand_id,
    attempt_no,
    'started',
    jsonb_build_object('provider',coalesce(a.provider,'buffer'))
  );

  return jsonb_build_object(
    'queue_id',q.id,
    'attempt_no',attempt_no,
    'brand_id',q.brand_id,
    'content_id',q.content_id,
    'account_id',q.account_id,
    'provider',coalesce(a.provider,'buffer'),
    'provider_channel_id',coalesce(a.provider_channel_id,a.buffer_channel_id),
    'platform',c.platform,
    'caption',coalesce(c.caption,''),
    'due_at',q.due_at,
    'creative_view_url',c.creative_view_url,
    'payload',c.payload
  );
end;
$$;

create or replace function public.sm_finish_queue(
  p_queue_id uuid,
  p_outcome text,
  p_external_post_id text default null,
  p_external_url text default null,
  p_error text default null,
  p_detail jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare
  q public.sm_queue%rowtype;
  next_status text;
  final_external_id text;
begin
  select * into q from public.sm_queue where id=p_queue_id for update;
  if not found then raise exception 'queue_not_found'; end if;
  if not private.sm_can_edit(q.brand_id) then raise exception 'not_allowed'; end if;

  if p_outcome not in ('published','scheduled','unknown','error') then
    raise exception 'invalid_outcome';
  end if;

  final_external_id := coalesce(p_external_post_id,q.external_post_id);

  if p_outcome='scheduled' then
    if q.status <> 'processando' then raise exception 'invalid_transition_to_scheduled'; end if;
    if final_external_id is null then raise exception 'external_post_id_required'; end if;
  elsif p_outcome='published' then
    if q.status <> 'enviado_api' then raise exception 'invalid_transition_to_published'; end if;
    if final_external_id is null then raise exception 'external_post_id_required'; end if;
  elsif p_outcome='unknown' then
    if q.status not in ('processando','enviado_api') then raise exception 'invalid_transition_to_unknown'; end if;
  elsif p_outcome='error' then
    if q.status not in ('processando','enviado_api','incerto') then raise exception 'invalid_transition_to_error'; end if;
  end if;

  next_status := case p_outcome
    when 'published' then 'publicado'
    when 'scheduled' then 'enviado_api'
    when 'unknown' then 'incerto'
    else 'falhou'
  end;

  update public.sm_queue
  set status=next_status,
      external_post_id=final_external_id,
      external_url=coalesce(p_external_url,external_url),
      last_error=p_error,
      sent_at=case when p_outcome in ('published','scheduled') then now() else sent_at end,
      confirmed_at=case when p_outcome='published' then now() else confirmed_at end,
      locked_at=null,
      next_attempt_at=case
        when next_status='falhou'
          then now() + make_interval(mins => least(60, (2 ^ greatest(attempts-1,0))::int))
        else null
      end,
      updated_at=now()
  where id=q.id;

  insert into public.sm_publish_attempts(queue_id,brand_id,attempt_no,outcome,detail)
  values(
    q.id,
    q.brand_id,
    q.attempts,
    p_outcome,
    coalesce(p_detail,'{}'::jsonb) || jsonb_build_object('error',p_error)
  );

  update public.sm_content
  set status=case
      when p_outcome='published' then 'publicado'
      when p_outcome='scheduled' then 'enviado_api'
      when p_outcome='error' then 'falhou'
      else status
    end,
    updated_at=now()
  where id=q.content_id;
end;
$$;

revoke execute on function public.sm_enqueue_content(uuid,uuid,timestamptz) from public, anon;
revoke execute on function public.sm_claim_queue(uuid) from public, anon;
revoke execute on function public.sm_finish_queue(uuid,text,text,text,text,jsonb) from public, anon;

grant execute on function public.sm_enqueue_content(uuid,uuid,timestamptz) to authenticated;
grant execute on function public.sm_claim_queue(uuid) to authenticated;
grant execute on function public.sm_finish_queue(uuid,text,text,text,text,jsonb) to authenticated;
