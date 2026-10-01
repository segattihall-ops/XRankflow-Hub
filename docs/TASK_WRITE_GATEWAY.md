# Task Write Gateway

Applied to the XRANKFLOW Hub Supabase project on 2026-09-30.

## Purpose

Task writes now use server-validated RPCs instead of direct browser inserts/updates.

## Database objects

- xrmg_task_audit_log
- xrmg_create_task(...)
- xrmg_update_task_status(...)

## Guarantees

- authenticated WorkHub membership required
- allowed status and priority values validated in the database
- project membership validated before linking a task
- idempotency keys prevent duplicate write side effects
- create/status-change actions are appended to the task audit log
- audit rows are readable only to authenticated WorkHub members under RLS
- direct audit-log inserts/updates/deletes are not granted to authenticated clients

## Application path

Browser -> /api/tasks -> Supabase authenticated session -> validated RPC -> wh_tasks + audit log

The UI re-reads tasks after every successful write and surfaces server errors instead of claiming success optimistically.
