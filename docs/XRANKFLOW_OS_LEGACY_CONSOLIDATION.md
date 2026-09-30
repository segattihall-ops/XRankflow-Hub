# XRANKFLOW OS — Legacy Consolidation Manifest

Target: `segattihall-ops/XRankflow-Hub`
Working branch: `feat/xrankflow-os-foundation`
Primary production interface: `admin.xrankflow.com`

## Goal

Consolidate all useful functionality, source material, architecture knowledge and operational behavior from:

- `admindash`
- `xrankflow-admin`
- `xrankflow-workhub`

into the canonical XRANKFLOW OS before any legacy project is deleted.

Deletion is explicitly out of scope until preservation + feature parity + production verification are complete.

## Source status

| Legacy system | Source located | Preserved in target | Functional migration state | Safe to delete |
| --- | --- | --- | --- | --- |
| admindash | Yes, GitHub | 71/73 blobs archived; secrets redacted | Features mapped; active reimplementation pending | No |
| xrankflow-workhub | Yes, deployed static HTML | Full recovered HTML snapshot archived | Core WorkHub CRUD/data concepts overlap current `wh_*`; parity review pending | No |
| xrankflow-admin | Vercel deployment located; original CLI source not proven | Deployment metadata documented | Route/feature recovery pending | No |

## What will be preserved functionally

From admindash:
- user/role administration;
- analytics;
- reports;
- settings;
- access-control concepts;
- AI command endpoint concept;
- MCP/integration adapter concepts for CRM, Vercel and Supabase.

From xrankflow-workhub:
- live Supabase-backed finance records;
- KPI scorecard;
- tasks/projects operating grid;
- people/team directory;
- holding command view;
- brand-filtered operations;
- inline create/update/delete behavior where safe.

From xrankflow-admin:
- every unique route, feature and administrative behavior once recovered/verified.

## Migration rule

Do not copy unsafe architecture merely for parity.

Use:
`PRESERVE BEHAVIOR -> MAP SOURCE OF TRUTH -> REIMPLEMENT SAFELY -> TEST -> VERIFY -> RETIRE LEGACY`

Legacy hardcoded credentials, static secrets, fake metrics and obsolete authentication implementations are evidence only and must not be reactivated.

## Retirement gate

A legacy project can be deleted only when all are true:

- source/functionality inventoried;
- unique data exported or proven external;
- unique feature implemented or explicitly retired;
- integrations/secrets mapped;
- URLs/consumers/dependencies checked;
- current XRANKFLOW OS passes lint/typecheck/build/tests;
- preview smoke test passes;
- production merge/deploy succeeds;
- production behavior verified;
- rollback/export retained;
- no unresolved P0/P1 dependency points to the legacy project.
