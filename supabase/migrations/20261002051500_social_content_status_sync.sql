-- Keep content status synchronized even if a queue was created from an approved item.
-- Applied to production Supabase on 2026-10-01.

create or replace function public.sm_sync_content_status(p_content uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v int;
  st text;
  n int;
  n_pub int;
  n_fail int;
  n_sent int;
  novo text;
begin
  select version,status into v,st
  from public.sm_content
  where id=p_content;

  if st not in ('aprovado','agendado','enviado_api','falhou','publicado') then
    return;
  end if;

  select count(*),
         count(*) filter(where status='publicado'),
         count(*) filter(where status='falhou'),
         count(*) filter(where status in ('enviado_api','publicado'))
    into n,n_pub,n_fail,n_sent
  from public.sm_queue
  where content_id=p_content
    and version=v
    and status not in ('cancelado','cancelando');

  if n=0 then return; end if;

  novo:=case
    when n_fail>0 then 'falhou'
    when n_pub=n then 'publicado'
    when n_sent>0 then 'enviado_api'
    else 'agendado'
  end;

  if novo<>st then
    update public.sm_content
    set status=novo,updated_at=now()
    where id=p_content;
  end if;
end;
$$;
