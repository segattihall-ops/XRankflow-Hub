# XRANKFLOW OS — Prioritized Backlog

**Baseline:** 2026-09-30  
**Canonical app:** `admin.xrankflow.com`  
**Repository:** `segattihall-ops/XRankflow-Hub`

## Priority policy

- **P0:** security, source-of-truth integrity, production availability.
- **P1:** minimum coherent operating surface.
- **P2:** cross-system expansion.
- **P3:** intelligence/automation after operational foundations are reliable.

## Phase 0 — Discovery

### P0.0 Canonical production map — COMPLETE
Acceptance:
- Vercel project identified.
- GitHub repo/branch identified.
- Hub Supabase project identified.
- historical duplicates identified but not deleted.

### P0.1 Source classification — IN PROGRESS
Acceptance:
- every module declares a source of truth or “not connected”.
- unknown sources cannot render healthy.
- placeholder data never appears as current fact.

### P0.2 Historical credential hygiene — P0
Acceptance:
- exposed examples are removed from current public docs.
- any actually exposed credential is rotated externally.
- historical repos are marked legacy where appropriate.
- no current production secret is committed.

## Phase 1 — Foundation

### P1.1 XRANKFLOW OS responsive shell — P0
Scope:
- Portuguese navigation.
- desktop sidebar.
- mobile navigation.
- remove stale Replit messaging.
- XRANKFLOW OS metadata.

Acceptance:
- critical routes usable at 375px.
- desktop remains stable.
- lint/typecheck/build pass.

### P1.2 Truthful CEO Command Center — P0
Scope:
- live `wh_tasks`, `wh_projects`, `wh_kpis`, `wh_brands`, `wh_finance`.
- Hoje.
- Precisa de atenção.
- data-quality notices.
- quick actions.

Acceptance:
- Home has no `mockData` dependency.
- query failure is not displayed as zero.
- overdue/due today derives from actual due dates.
- finance values are labeled as WorkHub records, not accounting truth.

### P1.3 Integration + Source-of-Truth Registry — P0
Acceptance:
- connected/partial/pending distinct.
- no secret shown to browser.
- authority + supported actions visible.
- discovery snapshot date visible.
- snapshot does not impersonate live health.

### P1.4 Shared UX states — P1
Acceptance:
- Loading, Empty, Error, Not Connected patterns.
- human-language technical errors.
- retry for safe reads.

### P1.5 Access model — P0
Acceptance:
- Owner/Admin/Manager/Employee/Contractor/Read Only matrix.
- no authorization depends on user-editable metadata.
- future writes specify capability and scope.

## Phase 2 — Unified Operations

### P2.1 Task/Project normalization — P1
Acceptance:
- projects from `wh_projects`.
- tasks relate to project/company where known.
- filters work.
- server-side validation for writes.
- action audit.

### P2.2 Operational Calendar — P1
Acceptance:
- due dates/milestones first.
- external meeting connector later.
- source IDs preserved.
- no replay duplicates.

### P2.3 Universal Inbox — P1
Acceptance:
- normalized inbox model.
- action availability from connector capability.
- archive/delegate/create-task idempotent.
- original source traceable.

### P2.4 Companies — P1
Acceptance:
- verified evidence state.
- unknown metrics explicit.
- no fabricated revenue/user counts.

### P2.5 CRM federation — P1
Acceptance:
- stable external IDs.
- deduplication.
- brand scope.
- source-linked relationship timeline.

### P2.6 System Health — P1
Acceptance:
- health from recent checks.
- stale checks cannot remain green.
- failed critical check can open incident.

### P2.7 Automation Catalog — P1
Acceptance:
- registry exposed through authorized service.
- last/next run visible when known.
- manual run only if executor exists.
- retries idempotent.

## Phase 3 — Business Intelligence

### P3.1 Finance federation — P1
Acceptance:
- authoritative ledger confirmed.
- currency/period/source/freshness explicit.
- disconnected data says “Fonte ainda não conectada”.

### P3.2 Executive KPI projection — P1
Acceptance:
- metric definition, source, owner, target, actual, freshness and health rule.

### P3.3 Marketing OS — P2
Acceptance:
- planned -> production -> review -> approved -> scheduled -> published -> measured.
- publication platforms remain delivery authority.

## Phase 4 — AI OS

### P4.1 AI Command Center read-only — P1
Acceptance:
- attention/overdue/company/health/source lookup commands.
- source-backed answers.
- permission filtering.

### P4.2 AI tool gateway — P0 before writes
Acceptance:
- structured schemas.
- capability checks.
- risk classification.
- idempotency.
- audit.
- verification.
- confirmation policy.

### P4.3 Guarded writes — P2
Initial:
- create task;
- update task status;
- record decision draft.

Acceptance:
- post-write re-read/verification.
- exact result shown.
- failures never report false success.

### P4.4 Custom MCP — P2
Acceptance:
- same service layer as UI.
- least privilege.
- no database service secret distributed to clients.
- ChatGPT/Claude transport verified.

## Phase 5 — Automation

### P5.1 Automation run ledger — P1
Acceptance:
- run ID, automation ID, idempotency key, timestamps, result, retry count, error class, payload reference.

### P5.2 Failure/recovery — P1
Acceptance:
- transient retry limits.
- permanent failures stop.
- duplicate side effects prevented.
- alert threshold.
- documented recovery.

### P5.3 CEO routines — P2
Examples:
- morning attention brief;
- weekly portfolio review;
- automation failure rollup;
- overdue work review.

## Phase 6 — Consolidation

### P6.1 Duplicate system retirement — P2
Acceptance:
- dependency evidence.
- backup/export if needed.
- redirect/docs plan.
- rollback window.

### P6.2 Knowledge migration — P2
Acceptance:
- Keep/Merge/Archive/Delete/External Authority classification.
- source links preserved.
- obsolete automations not blindly recreated.

## Universal Definition of Done

When applicable:

- implemented;
- lint PASS;
- typecheck PASS;
- tests PASS;
- build PASS;
- preview deploy PASS;
- production deploy PASS after merge;
- smoke test PASS;
- mobile verified;
- permission/error/empty/loading states verified;
- docs updated;
- rollback/recovery known.
