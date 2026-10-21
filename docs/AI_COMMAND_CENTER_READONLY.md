# AI Command Center — source-backed read-only queries

## Outcome

The existing `/ai` placeholder becomes five authenticated, deterministic queries:

| Command | Authoritative input | Result |
| --- | --- | --- |
| `attention` | `wh_tasks`, `wh_kpis`, `xrmg_incident_register` | Counts of overdue unfinished tasks, high-priority unfinished tasks, recorded KPI risk and recorded active incidents |
| `overdue` | `wh_tasks` | Tasks with a due date before the current UTC date that are not marked `Done` |
| `health` | `xrmg_system_checks`, `xrmg_incident_register` | Bounded health evidence with current, stale and unknown validity; recorded active-incident count |
| `company_status` | `wh_brands`, `wh_tasks`, `wh_projects`, `wh_kpis` | Exact visible aggregates scoped to the ID of an authorized brand slug |
| `source_lookup` | `lib/source-registry.ts` | Dated catalog snapshot, explicitly separate from live connectivity and permission verification |

This feature does not introduce a language model, execute arbitrary queries, or activate any operational workflow.

## Authorization and data boundaries

- `POST /api/ai/read` uses the existing `createSupabaseServerClient` and validates the authenticated user with `auth.getUser()` before querying any source.
- Cross-origin requests and unsupported commands are rejected. Source/brand selectors are validated; company aggregates use the resolved brand ID rather than a client-supplied ID.
- Queries use the session client and existing RLS. No service-role client, grants, RLS changes, database functions or migrations are added.
- Responses carry `Cache-Control: private, no-store`. Source failures return a generic recoverable error, without database error strings or a partial successful summary.
- The route exposes no writes, credential values, account-management actions, scheduler controls or outbound delivery operations.

## Evidence and count semantics

Task, KPI, project and incident aggregates use `select('id', { count: 'exact', head: true })`. They count records visible to the current session under the source's access rules; they are not counts inferred from a limited response array. A missing or malformed count is an error, never zero. Ordinary task titles, notes and owner identities are not fetched for these aggregate questions.

Tasks with null status are described as **not marked complete**, rather than assigned an invented active status. Null due dates and the current UTC date are excluded from overdue results. Incident filters use the source constraint's exact active values: `OPEN`, `INVESTIGATING`, `MITIGATING`; `RESOLVED` and `CLOSED` are excluded.

Health reads at most 200 records, ordered by source check time and ID, with an exact total. The response includes returned/total/limit/partial coverage. Validity counts describe only those returned records. Missing, invalid, reversed or future check timestamps are unknown; expiry at or before the query time is stale. No available records means current health is unknown. Valid evidence may still contain a failed status; validity does not mean that a system is healthy. This query reads recorded observations and does not run a live health check or prove coverage of every expected system.

The registry response includes its own snapshot date. The query time is not substituted for that snapshot date, and cataloged capabilities are not described as currently verified permissions.

## Client behavior

The page validates command identity, timestamps, source labels, summaries, required count fields and health coverage before rendering a result. A successful HTTP status with incomplete data remains an error. Network failures release loading and retain the selected query for retry.

Changing a command, company or source invalidates and aborts the previous request. Sequence checks also discard late responses from transports that ignore abort. Unmount cleanup prevents late query or brand-list completions from changing state. Brand-list failures have their own retry control and do not block other commands.

## Verification

Run the established CI gates plus the added suite:

```sh
npm ci
npm run lint
npm run test:tasks
npm run test:ai
npm run type-check
npm run build
```

`tests/ai-read-recovery.test.mjs` compiles and executes the actual route, shared contract and page modules. Only the session, transport, React-hook and Next-response boundaries are mocked. It covers 23 cases including invalid input and origin rejection, unauthenticated access, sanitized source failures, totals above former row limits, UTC due-date boundaries, brand isolation, incident status filtering, bounded/stale/unknown health evidence, historical registry labeling, malformed successful responses, retries, request races and unmount cleanup. The existing task-network tests remain part of CI.

The production schema was reviewed read-only on 2026-10-21 against project `njwqeulzythluenexdcw`. All six referenced tables/columns exist. The source incident-status constraint and unique `(system_key, check_key)` constraint were checked. Existing authenticated reads remain governed by `private.is_workhub_member()`; no role, grant or policy modification is included in this PR.

## Remaining acceptance gate

Unit/component transport tests, schema/RLS metadata and a successful build do not prove a legitimate user's authenticated end-to-end session. Before declaring the complete PR objective verified, exercise each command as an authorized member in the target deployment, verify a nonmember cannot read operational rows, and confirm the displayed scopes and health/catalog timestamps. No user impersonation, test-account provisioning, credential extraction or database writes should be used to bypass this gate.

The broader AI tool gateway remains a separate objective. Free-form tool execution and writes require their own capability, risk, idempotency, audit and post-action verification design.
