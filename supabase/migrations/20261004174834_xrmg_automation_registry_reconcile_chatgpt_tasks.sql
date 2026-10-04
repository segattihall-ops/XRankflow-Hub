insert into public.xrmg_automation_registry (
  automation_key, company_key, name, trigger_type, trigger_description,
  inputs, actions, outputs, human_approval, failure_conditions,
  logging_location, recovery_procedure, status, owner_agent,
  last_run_at, last_result, source_system, source_external_id,
  source_enabled, schedule_ical, last_synced_at, sync_status,
  priority, automation_level, frequency, risk_level
) values
(
  'xrmg.critical.work.watch','xrmg','XRMG Critical Work Watch','condition_watch','Daily actionable-change watch across XRMG work sources',
  '{"source":"ChatGPT Automations","scope":["MasseurMatch","Voxmation","The RankFlow","DespachanteUSA"],"dedupe":true}'::jsonb,
  '["Cross-check alerts against source of truth","Notify only actionable changes","Deduplicate repeated alerts"]'::jsonb,
  '["Founder alert only when action is required"]'::jsonb,
  'No routine approval; high-risk remediation remains human-gated',
  '["source unavailable","duplicate alert","unverified email alert"]'::jsonb,
  'ChatGPT Automations + XRMG Automation OS',
  'Continue independent checks; preserve source gap; never infer healthy state from missing evidence',
  'ACTIVE','XRMG OS','2026-10-04T13:22:53.525351Z','Scheduler execution observed',
  'chatgpt_automations','6abdc575e48c8191bae93f21f1f63355',true,
  E'BEGIN:VEVENT\nDTSTART:20261001T023009Z\nRRULE:FREQ=DAILY;BYHOUR=8\nEND:VEVENT',
  now(),'VERIFIED','P0',3,'Daily','high'
),
(
  'xrmg.agent.payment','xrmg','XRMG Agent Payment','condition_watch','Watch registered-agent invoice resolution and service risk',
  '{"source":"ChatGPT Automations","invoice":"2GZZB7G7"}'::jsonb,
  '["Check resolution evidence","Escalate only unresolved deadline or new cancellation risk"]'::jsonb,
  '["Payment attention alert only when required"]'::jsonb,
  'Payment execution remains human-controlled',
  '["payment unresolved near deadline","service-risk warning"]'::jsonb,
  'ChatGPT Automations + Gmail evidence',
  'Keep watching until paid/resolved; never assume payment from silence',
  'ACTIVE','XRMG Finance Ops','2026-10-04T13:13:42.665436Z','Scheduler execution observed',
  'chatgpt_automations','6abda25384e08191900472244b73dc6b',true,
  E'BEGIN:VEVENT\nDTSTART:20261001T080000\nRRULE:FREQ=DAILY;BYHOUR=8;UNTIL=20261031T045959\nEND:VEVENT',
  now(),'VERIFIED','P1',2,'Daily through 2026-10-30','high'
),
(
  'masseurmatch.competitor.watch','masseurmatch','MasseurMatch Competitor Watch','condition_watch','Daily material competitor-change watch',
  '{"source":"ChatGPT Automations","competitors":["MasseurFinder","RentMasseur"]}'::jsonb,
  '["Compare prior observed state","Ignore cosmetic changes","Notify on material product/pricing changes"]'::jsonb,
  '["Pricing/positioning/roadmap review alert"]'::jsonb,
  'No routine approval',
  '["source unavailable","duplicate observation","non-material cosmetic change"]'::jsonb,
  'ChatGPT Automations + public competitor evidence',
  'Retry next cycle; preserve last verified state',
  'ACTIVE','MasseurMatch Strategy','2026-10-03T18:52:32.070823Z','Scheduler execution observed',
  'chatgpt_automations','6abd5373d4f4819197a572391a28638f',true,
  E'BEGIN:VEVENT\nDTSTART:20260930T182343Z\nRRULE:FREQ=DAILY\nEND:VEVENT',
  now(),'VERIFIED','P1',3,'Daily','medium'
),
(
  'xrmg.business.opportunity.watch','xrmg','95+ Business Opportunity Watch','condition_watch','Weekly market scan for unusually strong low-cost automatable opportunities',
  '{"source":"ChatGPT Automations","threshold":95}'::jsonb,
  '["Research current markets","Verify authoritative facts","Notify only >=95/100 or materially stronger opportunity"]'::jsonb,
  '["Opportunity alert with evidence and score"]'::jsonb,
  'Founder decision required before capital or legal commitment',
  '["insufficient evidence","inflated score","material claim unverified"]'::jsonb,
  'ChatGPT Automations + authoritative web evidence',
  'Return no alert if threshold is not met',
  'ACTIVE','XRMG Strategy','2026-09-28T15:05:05.221422Z','Scheduler execution observed',
  'chatgpt_automations','6aac828dc0508191895c1e3c64e5b6cd',true,
  E'BEGIN:VEVENT\nDTSTART:20260918T001609Z\nRRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8\nEND:VEVENT',
  now(),'VERIFIED','P2',3,'Weekly','medium'
)
on conflict (automation_key) do update set
  company_key=excluded.company_key, name=excluded.name,
  trigger_type=excluded.trigger_type, trigger_description=excluded.trigger_description,
  inputs=excluded.inputs, actions=excluded.actions, outputs=excluded.outputs,
  human_approval=excluded.human_approval, failure_conditions=excluded.failure_conditions,
  logging_location=excluded.logging_location, recovery_procedure=excluded.recovery_procedure,
  status=excluded.status, owner_agent=excluded.owner_agent,
  last_run_at=excluded.last_run_at, last_result=excluded.last_result,
  source_system=excluded.source_system, source_external_id=excluded.source_external_id,
  source_enabled=excluded.source_enabled, schedule_ical=excluded.schedule_ical,
  last_synced_at=excluded.last_synced_at, sync_status=excluded.sync_status,
  priority=excluded.priority, automation_level=excluded.automation_level,
  frequency=excluded.frequency, risk_level=excluded.risk_level, updated_at=now();

update public.xrmg_automation_registry
set status='ACTIVE', source_system='chatgpt_automations',
    source_external_id='6aba7b8269488191b85e49f8e86785ce', source_enabled=true,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART:20261005T090000\nRRULE:FREQ=WEEKLY;BYDAY=MO\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P1', automation_level=3,
    frequency='Weekly', risk_level='medium', last_run_at=null,
    last_result='Enabled; source state verified 2026-10-04', updated_at=now()
where automation_key='xrmg.weekly.review';

update public.xrmg_automation_registry
set status='PAUSED', source_system='chatgpt_automations',
    source_external_id='6aba7b7a4e1c8191821a5e6111872fad', source_enabled=false,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART:20260929T080000\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P2', automation_level=3,
    frequency='Weekdays', risk_level='medium', last_run_at=null,
    last_result='Paused; source state verified 2026-10-04', updated_at=now()
where automation_key='xrmg.daily.executive';

update public.xrmg_automation_registry
set status='PAUSED', source_system='chatgpt_automations',
    source_external_id='6aba79ea9a80819192e6e3634b8d33ca', source_enabled=false,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART:20260928T143102Z\nRRULE:FREQ=HOURLY\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P2', automation_level=3,
    frequency='Hourly', risk_level='medium', last_run_at='2026-09-28T21:16:48.016300Z',
    last_result='Paused; superseded by XRMG Critical Work Watch', updated_at=now()
where automation_key='xrmg.incident.watch';

update public.xrmg_automation_registry
set status='PAUSED', source_system='chatgpt_automations',
    source_external_id='6ab44868f02481919499e370fc863ef4', source_enabled=false,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART;TZID=America/Chicago:20260929T080000\nRRULE:FREQ=DAILY\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P3', automation_level=2,
    frequency='Daily', risk_level='low', last_run_at='2026-09-28T14:48:13.590141Z',
    last_result='Paused; source state verified 2026-10-04', updated_at=now()
where automation_key='piroka.daily.review';

update public.xrmg_automation_registry
set status='ACTIVE', source_system='chatgpt_automations',
    source_external_id='6ab4486e04f88191b76a0fcfa332775f', source_enabled=true,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART;TZID=America/Chicago:20261005T080000\nRRULE:FREQ=WEEKLY;BYDAY=MO\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P2', automation_level=2,
    frequency='Weekly', risk_level='low', last_run_at='2026-09-28T15:06:33.509303Z',
    last_result='Enabled; source state verified 2026-10-04', updated_at=now()
where automation_key='piroka.weekly.review';

update public.xrmg_automation_registry
set status='ACTIVE', source_system='chatgpt_automations',
    source_external_id='6ab448712698819182fcc34c3074cadf', source_enabled=true,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART;TZID=America/Chicago:20261002T150000\nRRULE:FREQ=WEEKLY;BYDAY=FR\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P2', automation_level=2,
    frequency='Weekly Friday', risk_level='low', last_run_at='2026-10-02T20:43:31.824171Z',
    last_result='Enabled; source state verified 2026-10-04', updated_at=now()
where automation_key='piroka.friday.close';

update public.xrmg_automation_registry
set status='ACTIVE', source_system='chatgpt_automations',
    source_external_id='6ab4487402208191a89fd64494f0cedf', source_enabled=true,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART;TZID=America/Chicago:20261001T080000\nRRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P2', automation_level=2,
    frequency='Monthly', risk_level='low', last_run_at='2026-10-01T14:39:02.500011Z',
    last_result='Enabled; source state verified 2026-10-04', updated_at=now()
where automation_key='piroka.monthly.audit';

update public.xrmg_automation_registry
set status='ACTIVE', source_system='chatgpt_automations',
    source_external_id='6a90bbd824d081918cb93a19ab2ce101', source_enabled=true,
    schedule_ical=E'BEGIN:VEVENT\nDTSTART;TZID=America/Chicago:20260831T080000\nRRULE:FREQ=WEEKLY;BYDAY=MO\nEND:VEVENT',
    last_synced_at=now(), sync_status='VERIFIED', priority='P1', automation_level=3,
    frequency='Weekly', risk_level='medium', last_run_at='2026-09-28T13:28:11.276209Z',
    last_result='Enabled; source state verified 2026-10-04', updated_at=now()
where automation_key='masseurmatch.stack.watch';

insert into public.xrmg_automation_runs (
  automation_key, external_run_id, idempotency_key, status, started_at,
  trigger_event, output_ref, evidence
) values
('xrmg.critical.work.watch','2026-10-04T13:22:53.525351Z','chatgpt:6abdc575e48c8191bae93f21f1f63355:2026-10-04T13:22:53.525351Z','PARTIAL','2026-10-04T13:22:53.525351Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('xrmg.agent.payment','2026-10-04T13:13:42.665436Z','chatgpt:6abda25384e08191900472244b73dc6b:2026-10-04T13:13:42.665436Z','PARTIAL','2026-10-04T13:13:42.665436Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('masseurmatch.competitor.watch','2026-10-03T18:52:32.070823Z','chatgpt:6abd5373d4f4819197a572391a28638f:2026-10-03T18:52:32.070823Z','PARTIAL','2026-10-03T18:52:32.070823Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('xrmg.business.opportunity.watch','2026-09-28T15:05:05.221422Z','chatgpt:6aac828dc0508191895c1e3c64e5b6cd:2026-09-28T15:05:05.221422Z','PARTIAL','2026-09-28T15:05:05.221422Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('xrmg.incident.watch','2026-09-28T21:16:48.016300Z','chatgpt:6aba79ea9a80819192e6e3634b8d33ca:2026-09-28T21:16:48.016300Z','PARTIAL','2026-09-28T21:16:48.016300Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Historical scheduler run observed; task is now paused"}'),
('piroka.daily.review','2026-09-28T14:48:13.590141Z','chatgpt:6ab44868f02481919499e370fc863ef4:2026-09-28T14:48:13.590141Z','PARTIAL','2026-09-28T14:48:13.590141Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Historical scheduler run observed; task is now paused"}'),
('piroka.weekly.review','2026-09-28T15:06:33.509303Z','chatgpt:6ab4486e04f88191b76a0fcfa332775f:2026-09-28T15:06:33.509303Z','PARTIAL','2026-09-28T15:06:33.509303Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('piroka.friday.close','2026-10-02T20:43:31.824171Z','chatgpt:6ab448712698819182fcc34c3074cadf:2026-10-02T20:43:31.824171Z','PARTIAL','2026-10-02T20:43:31.824171Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('piroka.monthly.audit','2026-10-01T14:39:02.500011Z','chatgpt:6ab4487402208191a89fd64494f0cedf:2026-10-01T14:39:02.500011Z','PARTIAL','2026-10-01T14:39:02.500011Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}'),
('masseurmatch.stack.watch','2026-09-28T13:28:11.276209Z','chatgpt:6a90bbd824d081918cb93a19ab2ce101:2026-09-28T13:28:11.276209Z','PARTIAL','2026-09-28T13:28:11.276209Z',
 '{"source":"scheduler_last_run"}','{}','{"note":"Scheduler run observed; downstream outcome not independently verified"}')
on conflict (idempotency_key) do nothing;
