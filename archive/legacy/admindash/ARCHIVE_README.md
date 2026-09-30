# Legacy archive — admindash

Source repository: `segattihall-ops/admindash`
Source ref: `claude/project-analysis-report-01RqZkcqejkEsgEC9bMK92vD`
Source tree: `851294f5832ed24013fcd072d38ae15f99b45263`
Archived into XRANKFLOW OS: 2026-09-30

## Preservation status

- 71 of 73 source blobs were copied into this archive.
- Secrets/password examples found in legacy text were intentionally redacted during preservation and must never be restored from historical material.
- Two source paths could not be copied through the connected GitHub text interface because both resolve to the same non-UTF-8 25,931-byte blob:
  - `app/favicon.ico`
  - `route.ts`
- The identical blob SHA for both paths is `718d6fea4835ec2d246af9800eddb7ffb276240c`. The second path appears to be a malformed/duplicate binary entry rather than usable TypeScript source.
- Do not delete the original repository until the legacy-retirement checklist is explicitly marked safe.

## Functionality discovered

The legacy implementation contains concepts to preserve in the active XRANKFLOW OS architecture:

- Admin / Manager / Viewer role hierarchy.
- User administration.
- Analytics.
- Reports.
- Settings.
- JWT-era authentication implementation (historical only; do not reactivate).
- AI API route.
- MCP-style adapter endpoint.
- Zoho CRM read adapter.
- Vercel deployment read adapter.
- Supabase advisor read adapter.
- Responsive admin components and UI primitives.

## Security warning

The source repository historically exposed plaintext example credentials and a static JWT secret in documentation. Those values are compromised by definition. They were redacted in this archive. XRANKFLOW OS must use the current Supabase authentication/authorization model or an explicitly approved successor; do not restore the legacy credential model.
