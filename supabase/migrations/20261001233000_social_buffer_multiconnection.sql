-- Social Media OS: multi-account Buffer connections + Supabase-native worker
-- Live schema applied on 2026-10-01.

create table if not exists public.sm_provider_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.sm_brands(id) on delete cascade,
  provider text not null default 'buffer',
  label text not null,
  organization_id text,
  external_account_id text,
  secret_name text not null unique,
  status text not null default 'needs_key'
    check (status in ('needs_key','configured','verified','error','disabled')),
  last_verified_at timestamptz,
  last_error text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, provider, label)
);

alter table public.sm_accounts
  add column if not exists provider_connection_id uuid
  references public.sm_provider_connections(id) on delete set null;

create index if not exists sm_provider_connections_brand
  on public.sm_provider_connections(brand_id,provider,status);

alter table public.sm_provider_connections enable row level security;
revoke all on table public.sm_provider_connections from anon, authenticated;
grant select on table public.sm_provider_connections to authenticated;

drop policy if exists sm_provider_connections_read on public.sm_provider_connections;
create policy sm_provider_connections_read
on public.sm_provider_connections for select to authenticated
using (private.sm_brand_ok(brand_id));

create or replace function public.sm_upsert_buffer_connection(
  p_brand uuid,
  p_label text,
  p_organization_id text,
  p_api_key text
) returns uuid
language plpgsql
security definer
set search_path=public,private,vault,auth,pg_temp
as $$
declare cid uuid; sname text; sid uuid;
begin
  if not private.sm_can_edit(p_brand) and not private.sm_is_admin() then
    raise exception 'Sem permissão para configurar esta marca' using errcode='42501';
  end if;
  if coalesce(btrim(p_label),'')='' then raise exception 'Nome da conexão obrigatório'; end if;
  if coalesce(btrim(p_api_key),'')='' then raise exception 'Chave do Buffer obrigatória'; end if;

  select id,secret_name into cid,sname
  from public.sm_provider_connections
  where brand_id=p_brand and provider='buffer' and label=btrim(p_label)
  for update;

  if cid is null then
    cid:=gen_random_uuid();
    sname:='sm_buffer_conn_'||replace(cid::text,'-','');
    insert into public.sm_provider_connections(
      id,brand_id,provider,label,organization_id,secret_name,status
    ) values (
      cid,p_brand,'buffer',btrim(p_label),nullif(btrim(p_organization_id),''),sname,'configured'
    );
  else
    update public.sm_provider_connections
    set organization_id=nullif(btrim(p_organization_id),''),
        status='configured',last_error=null,updated_at=now()
    where id=cid;
  end if;

  select id into sid from vault.secrets where name=sname;
  if sid is null then
    perform vault.create_secret(btrim(p_api_key),sname,'XRMG Social Media OS Buffer connection');
  else
    perform vault.update_secret(sid,btrim(p_api_key));
  end if;

  if nullif(btrim(p_organization_id),'') is not null then
    update public.sm_accounts
    set provider_connection_id=cid,updated_at=now()
    where brand_id=p_brand
      and provider='buffer'
      and provider_meta->>'organization_id'=btrim(p_organization_id);
  end if;

  insert into public.sm_audit_log(actor,action,entity,entity_id)
  values(lower(auth.jwt()->>'email'),'BUFFER_CONNECTION_CONFIGURED','sm_provider_connection',cid::text);

  return cid;
end;
$$;

create or replace function public.sm_connection_mark_verified(
  p_connection uuid,
  p_ok boolean,
  p_external_account_id text default null,
  p_organization_id text default null,
  p_error text default null,
  p_meta jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path=public,private,auth,pg_temp
as $$
declare b uuid;
begin
  select brand_id into b from public.sm_provider_connections where id=p_connection;
  if b is null then raise exception 'Conexão não encontrada'; end if;
  if auth.role()<>'service_role' and not private.sm_can_edit(b) then
    raise exception 'Sem permissão' using errcode='42501';
  end if;

  update public.sm_provider_connections
  set status=case when p_ok then 'verified' else 'error' end,
      external_account_id=coalesce(nullif(p_external_account_id,''),external_account_id),
      organization_id=coalesce(nullif(p_organization_id,''),organization_id),
      last_verified_at=case when p_ok then now() else last_verified_at end,
      last_error=case when p_ok then null else p_error end,
      meta=coalesce(meta,'{}'::jsonb)||coalesce(p_meta,'{}'::jsonb),
      updated_at=now()
  where id=p_connection;
end;
$$;

create or replace function public.sm_get_connection_secret(p_connection uuid)
returns text
language sql
stable
security definer
set search_path=public,vault,auth,pg_temp
as $$
  select ds.decrypted_secret
  from public.sm_provider_connections c
  join vault.decrypted_secrets ds on ds.name=c.secret_name
  where c.id=p_connection and auth.role()='service_role'
  limit 1;
$$;

revoke execute on function public.sm_upsert_buffer_connection(uuid,text,text,text) from public,anon;
grant execute on function public.sm_upsert_buffer_connection(uuid,text,text,text) to authenticated,service_role;
revoke execute on function public.sm_connection_mark_verified(uuid,boolean,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.sm_connection_mark_verified(uuid,boolean,text,text,text,jsonb) to service_role;
revoke execute on function public.sm_get_connection_secret(uuid) from public,anon,authenticated;
grant execute on function public.sm_get_connection_secret(uuid) to service_role;

create or replace function public.sm_worker_status()
returns jsonb
language sql
stable
security definer
set search_path=public,vault,auth,cron,pg_temp
as $$
  select case when private.sm_role() is null then '{}'::jsonb else jsonb_build_object(
    'cron_secret', exists(select 1 from vault.secrets where name='sm_cron_secret'),
    'publisher_cron', exists(select 1 from cron.job where active and command like '%sm_cron_tick(''run'')%'),
    'metrics_cron', exists(select 1 from cron.job where active and command like '%sm_cron_tick(''metrics'')%'),
    'connections_total', (select count(*) from public.sm_provider_connections where status<>'disabled'),
    'connections_verified', (select count(*) from public.sm_provider_connections where status='verified'),
    'connections_needing_key', (
      select count(*) from public.sm_provider_connections c
      where c.status='needs_key'
         or not exists(select 1 from vault.secrets s where s.name=c.secret_name)
    ),
    'connections_error', (select count(*) from public.sm_provider_connections where status='error')
  ) end;
$$;

revoke execute on function public.sm_worker_status() from public,anon;
grant execute on function public.sm_worker_status() to authenticated,service_role;

create or replace function public.sm_queue_snapshot_guard()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare c public.sm_content%rowtype; a public.sm_accounts%rowtype; conn public.sm_provider_connections%rowtype;
begin
  if tg_op='UPDATE' then
    if new.dispatch_snapshot is distinct from old.dispatch_snapshot and old.dispatch_snapshot is not null then
      raise exception 'Payload aprovado da fila é imutável';
    end if;
    return new;
  end if;

  select * into strict c from public.sm_content where id=new.content_id;
  select * into strict a from public.sm_accounts where id=new.account_id;
  if a.provider_connection_id is not null then
    select * into conn from public.sm_provider_connections where id=a.provider_connection_id;
  end if;

  if c.brand_id<>new.brand_id or a.brand_id<>new.brand_id or a.platform<>c.platform or c.version<>new.version then
    raise exception 'Marca, conta ou versão incompatível com a peça';
  end if;

  new.dispatch_snapshot:=jsonb_build_object(
    'post_text',public.sm_post_text(c),
    'channel_id',coalesce(a.provider_channel_id,a.buffer_channel_id),
    'platform',c.platform,
    'format',c.format,
    'asset_url',c.asset_url,
    'creative_assets',coalesce(c.creative_assets,'[]'::jsonb),
    'content_version',c.version,
    'provider',coalesce(a.provider,'buffer'),
    'provider_connection_id',a.provider_connection_id,
    'organization_id',conn.organization_id
  );
  return new;
end;
$$;

create or replace function public.sm_claim_due_v3(p_limit integer default 20,p_test boolean default false)
returns table(
  queue_id uuid, action text, post_text text, due_at timestamptz, channel_id text,
  platform text, format text, asset_url text, creative_assets jsonb,
  external_post_id text, attempts integer, max_attempts integer,
  idempotency_key text, provider text, provider_connection_id uuid, organization_id text
)
language sql
security definer
set search_path=public,pg_temp
as $$
  with due as (
    select q.id,
      case when q.status='cancelando' then 'cancelar'
           when q.status='enviado_api' then 'confirmar'
           when q.status in ('incerto','processando') then 'reconciliar'
           else 'enviar' end as act
    from public.sm_queue q
    join public.sm_brands b on b.id=q.brand_id
    join public.sm_accounts a on a.id=q.account_id
    join public.sm_content c on c.id=q.content_id
    left join public.sm_campaigns cp on cp.id=c.campaign_id
    where q.is_test=p_test
      and q.dispatch_snapshot is not null
      and (q.locked_at is null or q.locked_at<now()-interval '10 minutes')
      and (
        (q.status in ('cancelando','processando') and coalesce(q.next_attempt_at,now())<=now())
        or (q.status in ('pendente','incerto') and coalesce(q.next_attempt_at,now())<=now()
            and not b.paused and not a.paused and not coalesce(cp.paused,false))
        or (q.status='enviado_api' and q.due_at<=now()-interval '2 minutes'
            and coalesce(q.next_attempt_at,now())<=now())
      )
    order by q.due_at
    limit p_limit
    for update of q skip locked
  ), upd as (
    update public.sm_queue q
      set locked_at=now(),updated_at=now(),
          status=case when d.act in ('enviar','reconciliar') then 'processando' else q.status end
    from due d where q.id=d.id
    returning q.id,d.act,q.content_id,q.account_id,q.due_at,q.external_post_id,
              q.attempts,q.max_attempts,q.idempotency_key
  )
  select u.id,u.act,
         coalesce(q.dispatch_snapshot->>'post_text',public.sm_post_text(c)),
         u.due_at,
         coalesce(q.dispatch_snapshot->>'channel_id',a.provider_channel_id,a.buffer_channel_id),
         c.platform,c.format,
         coalesce(q.dispatch_snapshot->>'asset_url',c.asset_url),
         coalesce(q.dispatch_snapshot->'creative_assets',c.creative_assets,'[]'::jsonb),
         u.external_post_id,u.attempts,u.max_attempts,u.idempotency_key,
         coalesce(q.dispatch_snapshot->>'provider',a.provider,'buffer'),
         coalesce(nullif(q.dispatch_snapshot->>'provider_connection_id','')::uuid,a.provider_connection_id),
         coalesce(q.dispatch_snapshot->>'organization_id',pc.organization_id)
  from upd u
  join public.sm_queue q on q.id=u.id
  join public.sm_content c on c.id=u.content_id
  join public.sm_accounts a on a.id=u.account_id
  left join public.sm_provider_connections pc on pc.id=a.provider_connection_id;
$$;

revoke execute on function public.sm_claim_due_v3(integer,boolean) from public,anon,authenticated;
grant execute on function public.sm_claim_due_v3(integer,boolean) to service_role;

create or replace function public.sm_published_for_metrics_v2(p_days integer default 30)
returns table(queue_id uuid,external_post_id text,provider_connection_id uuid)
language sql
security definer
set search_path=public,pg_temp
as $$
  select q.id,q.external_post_id,a.provider_connection_id
  from public.sm_queue q
  join public.sm_accounts a on a.id=q.account_id
  where q.status='publicado' and not q.is_test and q.external_post_id is not null
    and q.confirmed_at>now()-make_interval(days=>p_days);
$$;

revoke execute on function public.sm_published_for_metrics_v2(integer) from public,anon,authenticated;
grant execute on function public.sm_published_for_metrics_v2(integer) to service_role;

create or replace function public.sm_cron_tick(p_mode text default 'run')
returns bigint
language plpgsql
security definer
set search_path=public,vault,net,pg_temp
as $$
declare sec text; rid bigint; has_key boolean;
begin
  select decrypted_secret into sec from vault.decrypted_secrets where name='sm_cron_secret';
  select exists(
    select 1
    from public.sm_provider_connections c
    join vault.secrets s on s.name=c.secret_name
    where c.provider='buffer' and c.status in ('configured','verified')
  ) into has_key;

  if sec is null or not has_key then return null; end if;

  if p_mode='run' and not exists(
    select 1 from public.sm_queue
    where not is_test and status in ('pendente','incerto','cancelando','processando','enviado_api')
  ) then return null; end if;

  select net.http_post(
    url:='https://njwqeulzythluenexdcw.supabase.co/functions/v1/sm-publisher',
    headers:=jsonb_build_object('Content-Type','application/json','x-sm-secret',sec),
    body:=jsonb_build_object('mode',p_mode),
    timeout_milliseconds:=25000
  ) into rid;
  return rid;
end;
$$;

revoke execute on function public.sm_cron_tick(text) from public,anon,authenticated;
grant execute on function public.sm_cron_tick(text) to postgres,service_role;
