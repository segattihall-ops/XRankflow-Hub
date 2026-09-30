# XRANKFLOW OS — Master Architecture & PRD

**Status:** Living specification  
**Baseline:** 2026-09-30  
**Primary interface:** https://admin.xrankflow.com  
**Canonical implementation:** `segattihall-ops/XRankflow-Hub`

## 1. Product principle

XRANKFLOW OS is the simplest possible operating interface over the most powerful possible operational architecture.

**The complexity belongs to the system. The simplicity belongs to the user.**

A routine operation should not require knowledge of GitHub, Supabase, Vercel, SQL, APIs, cron syntax, automation infrastructure, or deployment tooling.

## 2. Verified current state

### Confirmed

- `admin.xrankflow.com` is currently served by Vercel project `x-rankflow-hub`.
- Production is connected to GitHub repository `segattihall-ops/XRankflow-Hub`, branch `main`.
- Current stack: Next.js 14, React 18, TypeScript, Tailwind CSS and Supabase.
- Hub authentication currently uses Supabase Auth and middleware-side `getUser()` verification.
- Current operational data used by the Hub includes `wh_organizations`, `wh_brands`, `wh_people`, `wh_projects`, `wh_tasks`, `wh_finance` and `wh_kpis`.
- Those `wh_*` tables have RLS enabled and are scoped to authenticated WorkHub members.
- The same Supabase project already contains XRMG registers for portfolio, decisions, risks, incidents, KPIs, tasks and automations.
- Separate active Supabase projects exist for MasseurMatch and PIROKA.
- Vercel currently contains projects for MasseurMatch, Voxmation, TheRankFlow, PIROKA and historical XRANKFLOW/admin experiments.
- The current Hub still contains demo/placeholder data in `data/mockData.ts`; those values must not be presented as current business facts.
- The existing shell is primarily desktop-oriented and needs a mobile operating experience.
- Latest queried Vercel runtime error view returned no error clusters for the current Hub during the selected seven-day window.

### Historical / superseded

- Repositories/projects such as `admindash`, `admindashboard`, older `xrankflow-admin` and WorkHub experiments are not the canonical production app behind `admin.xrankflow.com`.
- Old Replit references remain in historical UI copy but production is currently served by Vercel.

### Requires verification before use

- authoritative accounting/banking/expense source;
- authoritative cross-brand CRM design;
- all email inbox owners and support inboxes;
- operational calendar authority;
- current SharePoint information architecture;
- full external automation inventory;
- payment processor ownership by brand;
- retirement safety of historical Vercel/admin projects;
- complete production status of all brands.

Unknown data must never be displayed as a real zero or as healthy.

## 3. Vision

A new authorized user should be able to open XRANKFLOW OS and understand, quickly:

1. what needs attention today;
2. what is overdue or blocked;
3. what is working or failing;
4. which company/product is affected;
5. who owns the next action;
6. what is scheduled;
7. what changed;
8. where the authoritative information lives;
9. what safe action can be taken now.

## 4. Architecture

### Experience Layer

Primary surface: `admin.xrankflow.com`

Core modules:

- CEO Command Center
- Universal Inbox
- Companies
- Projects
- Tasks
- Calendar
- CRM
- Finance OS
- Marketing OS
- Automation Center
- System Health
- AI Command Center
- Knowledge OS
- Global Search
- Integrations
- People & Access
- Audit / Activity

Mobile priority:

- Home
- Inbox
- Tasks
- Calendar
- Alerts / Approvals
- AI Assistant
- Quick Actions

### Application Layer

Business modules call stable service boundaries rather than vendor SDKs directly from UI pages.

Recommended domains:

- portfolio
- work
- people
- crm
- finance
- marketing
- knowledge
- automation
- health
- integrations
- ai
- audit

### AI Orchestration Layer

The AI layer is a controller over authorized tools, never an alternate source of truth.

Flow:

`USER -> XRANKFLOW OS -> COMMAND INTERPRETER -> AUTHORIZATION -> ORCHESTRATOR -> TOOL/WORKFLOW -> SOURCE SYSTEM -> VERIFICATION -> AUDIT -> RESULT`

Initial specialist capabilities:

- Executive / Operations
- Product / Engineering
- Growth / Marketing
- Finance analysis
- Security / QA

Agents are introduced only when they own a distinct workflow. Avoid overlapping agent swarms.

### Integration Layer

Each connector must declare:

- provider;
- connection state;
- scopes;
- supported reads;
- supported writes;
- source-of-truth categories;
- last successful verification/sync;
- error state;
- retry/rate-limit rules;
- audit requirements.

Preferred order:

1. official API/webhook;
2. vendor-supported MCP;
3. stable connector/plugin;
4. controlled custom adapter;
5. manual import only when no reliable API exists.

### Data Layer

Use a federated source-of-truth model.

XRANKFLOW OS owns or may own:

- portfolio registry;
- work/tasks/projects;
- decisions;
- risks;
- incidents;
- integration registry;
- automation registry;
- audit records;
- normalized external references;
- search metadata;
- permission mappings.

External authoritative data should be referenced rather than copied when possible.

### Automation Layer

Every production automation must define:

- trigger;
- canonical input IDs;
- idempotency key;
- conditions;
- side effects;
- outputs;
- retry policy;
- permanent failure policy;
- run ID;
- owner;
- log location;
- alert threshold;
- recovery procedure.

A cron configuration alone is not proof of health.

### Observability Layer

Minimum records:

- integration events;
- automation runs;
- system checks;
- audit events;
- incidents;
- AI tool runs.

User-facing status must be backed by recent evidence and show freshness.

### Security Layer

Requirements:

- authenticated human access;
- role/capability-based authorization;
- company/brand scope where relevant;
- server-side authorization for every write;
- RLS on every browser-reachable table;
- no private keys/service-role secrets in browser bundles;
- no secrets committed to Git;
- explicit confirmation for destructive/financial/legal/security-critical actions;
- input validation at trust boundaries;
- least-privilege connectors;
- AI tool calls use the same authorization model as UI;
- prompt/tool injection protection for untrusted external content;
- auditable critical actions.

## 5. Source-of-truth registry

Initial verified baseline:

| Category | Authority | State |
| --- | --- | --- |
| XRANKFLOW OS code | GitHub / `XRankflow-Hub` | Confirmed |
| XRANKFLOW OS deployments | Vercel / `x-rankflow-hub` | Confirmed |
| Hub human authentication | Current Hub Supabase Auth | Confirmed |
| Hub work data | Current Hub Supabase `wh_*` | Confirmed |
| XRMG operating registers | Current Hub Supabase `xrmg_*` | Schema confirmed; UI not fully connected |
| MasseurMatch product data | MasseurMatch Supabase project | Project confirmed; entity ownership mapping pending |
| PIROKA product data | PIROKA Supabase project | Project confirmed; entity ownership mapping pending |
| Other product code | GitHub repositories | Partial |
| Other deployments | Vercel projects | Partial |
| Email | Email provider | Not connected in OS |
| Calendar | Calendar provider | Not connected in OS |
| Official documents | Document platform | Current authority needs verification |
| Accounting/banking | Specialist financial system | Not verified |

The registry is a first-class admin object and every change is audited.

## 6. CEO Command Center

Home must be decision-oriented, not decorative.

Required sections:

### Hoje
- due today;
- overdue;
- priority work;
- scheduled critical events.

### Precisa de atenção
- failing systems;
- blocked work;
- approvals;
- incidents;
- stale integrations.

### Empresas
For each company/product, display only connected facts. Unknown values are explicitly unknown.

### KPIs
Every KPI includes:
- source;
- reporting period;
- freshness;
- owner;
- target;
- actual;
- health rule.

### Quick actions
- create task;
- open inbox;
- inspect health;
- ask AI;
- open integrations.

Acceptance:

- no demo/mock metric appears;
- failed data request is not rendered as zero;
- overdue is deterministically calculated;
- mobile places Today/Attention first;
- every aggregate is traceable to a source.

## 7. Universal Inbox

Normalized object:

- inbox_item_id;
- source_system;
- source_object_id;
- company_id;
- type;
- actor;
- subject;
- summary;
- received_at;
- priority;
- state;
- available_actions;
- deep_link.

Actions:

- Responder
- Delegar
- Criar tarefa
- Arquivar
- Resumir com IA
- Executar ação suportada

Only actions supported by the underlying connector may be shown.

## 8. Task & Project OS

Canonical relation:

`Company -> Objective -> Project -> Task -> Owner -> Due Date -> Status`

Task fields:

- title;
- company/brand;
- project;
- objective when applicable;
- owner;
- status;
- priority;
- due date;
- dependencies;
- source;
- external reference;
- automation state;
- created/updated timestamps.

Automated task creation must be idempotent.

## 9. Operational Calendar

Combines:

- meetings;
- task due dates;
- milestones;
- launches;
- campaigns;
- renewals;
- critical automation schedules.

External calendars remain authoritative for meetings. XRANKFLOW OS remains authoritative for OS-owned operational dates.

## 10. CRM

Use federation until a holding-wide CRM authority is formally declared.

Normalize:

- person/company;
- brand relationship;
- lead/client/provider/partner type;
- stage;
- owner;
- value when authoritative;
- next action;
- last interaction;
- external CRM ID;
- source.

Deduplicate via stable external IDs and normalized email/phone matching.

## 11. Finance OS

Finance is an aggregation/decision layer unless an explicit architecture decision makes it the ledger.

Every number must include:

- source;
- period;
- currency;
- freshness;
- aggregation rule.

Missing data renders: **Fonte ainda não conectada.**

## 12. Marketing OS

Workflow:

`Idea -> Planejado -> Produção -> Revisão -> Aprovado -> Agendado -> Publicado -> Medido`

Publication platforms remain authoritative for delivery and channel analytics.

## 13. Automation Center

Each automation shows:

- name;
- company;
- purpose;
- status;
- last run;
- next expected run;
- latest result;
- owner;
- simplified logs;
- recovery instructions.

Actions:

- Executar agora
- Pausar
- Reativar
- Ver histórico
- Repetir falha segura
- Pedir diagnóstico à IA

Success is reported only after downstream verification.

## 14. System Health

Status model:

- Green: recent verified checks within SLO;
- Yellow: stale/degraded/non-critical failure;
- Red: critical dependency/workflow failing;
- Gray: not monitored/insufficient evidence.

Configured is not the same as healthy.

## 15. AI Command Center

Initial supported command families:

- O que precisa da minha atenção hoje?
- O que está atrasado?
- Como está [empresa]?
- O que está quebrado?
- Verifique as automações.
- Encontre a fonte oficial de [assunto].
- Crie as tarefas necessárias.
- Prepare meu resumo executivo.

Write-capable AI actions require:

- authentication;
- authorization;
- validated structured input;
- idempotency;
- audit;
- verification;
- confirmation policy.

The AI must never report execution without tool-confirmed evidence.

## 16. AI tool risk model

- **R0** read-only non-sensitive.
- **R1** reversible low-impact write.
- **R2** consequential operational write.
- **R3** financial, legal, security, credential, destructive or public-release action.

R3 requires a human approval boundary unless a separately documented narrow deterministic policy explicitly authorizes it.

Every tool contract declares:

- JSON input schema;
- required capability;
- read/write class;
- risk class;
- confirmation rule;
- idempotency behavior;
- timeout/retry;
- verification method;
- audit payload.

## 17. Roles

Target roles:

- Owner
- Admin
- Manager
- Employee
- Contractor
- Read Only

Use capability checks such as:

- tasks.read
- tasks.write
- finance.read
- finance.write
- integrations.admin
- automation.run
- automation.admin
- ai.execute_write
- security.read

Authorization data must not rely on user-editable metadata.

## 18. UX requirements

- default language: clear Brazilian Portuguese;
- few clicks;
- predictable navigation;
- visible source/freshness for important data;
- shared loading/error/empty/not-connected states;
- technical details behind “Ver detalhes”;
- mobile-first for critical operations;
- destructive actions require confirmation;
- disabled actions explain what is missing.

Technical event example:

`CRON FAILED`

User-facing:

> Automação interrompida. A rotina responsável por [função] não concluiu a última execução.

Actions:

- Tentar novamente
- Ver detalhes
- Pedir para IA diagnosticar

## 19. Cross-system data contract

Cross-system references should use:

- source_system;
- source_object_type;
- source_object_id;
- canonical_object_id;
- company_id;
- first_seen_at;
- last_verified_at.

Side effects should use an idempotency key pattern such as:

`<workflow>:<source-system>:<source-object-id>:<action-version>`

## 20. Event model

Initial event families:

- work.task.created
- work.task.updated
- work.task.overdue
- project.state.changed
- integration.connection.changed
- integration.sync.failed
- automation.run.started
- automation.run.succeeded
- automation.run.failed
- deployment.completed
- health.check.changed
- incident.opened
- incident.resolved
- decision.recorded
- ai.tool.called
- ai.action.verified

Events are append-only observations, not replacements for domain tables.

## 21. SLOs and observability

Initial targets:

- production shell availability target: 99.9%;
- authenticated Home p95 target: <3s under normal warm conditions;
- connector reads degrade with timeout/error rather than hanging;
- every consequential write creates an audit record;
- automation failure appears within one expected execution interval;
- no silent fallback from failed live data to mock/demo data.

## 22. Product analytics

Core events:

- command_center.viewed
- attention_item.opened
- task.created
- task.completed
- integration.opened
- ai.command.submitted
- ai.command.completed
- ai.command.escalated
- search.performed
- sop.started
- sop.completed

Outcome metrics:

- time to identify top operational issue;
- manual system switches per routine;
- overdue work rate;
- automation success rate;
- incident MTTD/MTTR;
- AI verified-write success rate;
- founder-only intervention rate.

## 23. Implementation phases

### Phase 0 — Discovery
Inventory, classify, confirm canonical sources, identify duplicates and build the source registry.

### Phase 1 — Foundation
Auth/RBAC design, responsive shell, truthful Home, integrations registry, common UX states, CI.

### Phase 2 — Unified Operations
Tasks/projects, calendar, inbox, companies, CRM federation, health, automation catalog.

### Phase 3 — Business Intelligence
Finance aggregation, portfolio KPIs, marketing operations and freshness/source metadata.

### Phase 4 — AI OS
Command Center, retrieval, read tools, guarded write tools, audit and evaluations.

### Phase 5 — Automation
Event routing, run ledger, retries, recovery, recurring operating workflows.

### Phase 6 — Consolidation
Retire only proven obsolete duplicates and migrate authority deliberately.

## 24. Definition of Done

A feature is Done only when applicable evidence confirms:

- implemented;
- authorization verified;
- lint PASS;
- typecheck PASS;
- tests PASS;
- production build PASS;
- preview/production deployment PASS;
- smoke test PASS;
- mobile path verified;
- error/empty/loading states verified;
- documentation matches reality;
- rollback/recovery path documented.

Code written without verification is not Done.

## 25. Rollout

Meaningful changes should:

1. land on a feature branch;
2. pass validation;
3. deploy to Preview where available;
4. receive smoke tests;
5. merge to `main`;
6. verify production and critical routes.

Destructive schema changes are deferred until dependency evidence proves safety.

## 26. Immediate critical path

1. remove stale Replit messaging;
2. remove fake Home metrics/demo data;
3. implement Portuguese XRANKFLOW OS navigation;
4. make the shell mobile-usable;
5. build CEO Command Center from live `wh_*` data only;
6. add Integration + Source-of-Truth Registry;
7. keep current authentication/database stable;
8. validate through GitHub/Vercel before production.

This first increment intentionally avoids destructive schema changes.
