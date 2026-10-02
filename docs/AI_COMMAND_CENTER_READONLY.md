# AI Command Center — Read-Only v1

## Goal

Provide source-backed executive queries without introducing an LLM where deterministic code is sufficient.

## Supported commands

- attention
- overdue
- health
- company_status
- source_lookup

## Guardrails

- authenticated session required
- same-origin POST only
- no writes
- database reads remain subject to Supabase RLS
- each response declares its source tables/registry
- health checks mark expired evidence as stale
- unsupported commands are rejected

## Evaluation set

1. Unauthenticated request returns 401.
2. Unknown command returns 400.
3. Overdue never includes tasks with status Done.
4. Health reports expired checks as stale.
5. Company status is scoped to the selected brand ID after resolving an authorized slug.
6. Source lookup returns only entries in the Source-of-Truth Registry.
7. Query failure returns an error and never reports false success.

## Next gate

Free-form language and writes stay disabled until the tool gateway has capability checks, idempotency, audit, risk classification and post-action verification.
