# Social Media OS

Central multibrand social-media workspace embedded in XRANKFLOW Hub.

## Current implementation

- Dynamic brands with per-brand RLS.
- Campaign creation.
- Multichannel content packs for LinkedIn, Instagram carousel, Reels, TikTok, X, and Facebook.
- Approval/rejection flow.
- Scheduling metadata.
- Persistent content, versions, queue, attempts, metrics, costs, alerts, generation runs, facts, assets, research sources, and automation rules.
- Brand pause control.
- Explicit external-publication state: no item is marked published without an external confirmation path.

## Safety model

The default mode is semiautomatic. Content moves through review before scheduling. External publishing requires a connected provider/account and should store the returned external post ID and public URL.

All Social Media OS tables use row-level security. New knowledge tables are not granted to the anonymous role.

## External integrations

Buffer is the preferred publishing adapter when the linked account is available. The app intentionally reports publishing as unavailable rather than simulating success when an authorized provider is not connected.

Canva/Ocoya/other adapters can be added behind the same content/publishing model without changing brand or campaign data.

## Data model

Core tables:
- sm_brands
- sm_accounts
- sm_campaigns
- sm_content
- sm_content_versions
- sm_queue
- sm_publish_attempts
- sm_metrics
- sm_costs
- sm_alerts
- sm_audit_log
- sm_generation_runs

Knowledge and automation:
- sm_brand_facts
- sm_brand_assets
- sm_research_sources
- sm_automation_rules

## Operator workflow

1. Open Social Media OS.
2. Create/select a brand.
3. Create a campaign if needed.
4. Generate a multichannel pack.
5. Review each platform adaptation.
6. Approve or reject.
7. Schedule approved content.
8. Connect a publishing provider before enabling actual external publication.
9. Reconcile provider responses and save external IDs before marking a post published.

## Known external blocker

At implementation time, the Buffer app is present but no eligible linked Buffer account is available to the connector. Therefore live publication is deliberately not claimed or enabled.


## Template Engine

The Social Media OS now includes a template library and automatic template assignment.

Selection dimensions:
- brand
- platform
- content format
- aspect ratio
- language
- audience tags
- objective tags
- template priority

The user's Canva design `DAHWUodMYDE` is cataloged as a 21-page master library for MasseurMatch. The original design is treated as read-only source material by the OS.

Current Canva capabilities:
- Catalog existing layouts and their page numbers.
- Preserve the master source.
- Assign a compatible template to generated content.
- Apply field character limits before review when a field schema is known.
- Store a per-content template plan, including carousel slide assignments.
- Queue/record a creative render workflow.
- Open the Canva master from the dashboard.

The existing Canva design and available Brand Template currently expose no Autofill dataset. Therefore they run in `copy_manual` mode. The OS never claims that a final Canva file was generated when no authenticated runtime Canva API connection exists.

When a Canva source exposes an Autofill dataset, change its template capability to `autofill`; the selection engine will prefer it and the render workflow can be executed by an authenticated Canva adapter.

## Template workflow

1. Generate a multichannel content package.
2. Social Media OS selects compatible layouts.
3. Text is clipped to the layout field limits where configured.
4. The selected template and full `template_plan` are persisted with the content.
5. Use **Preparar arte** to create a render record.
6. If the template is `autofill`, the render may be processed by a configured Canva adapter.
7. If it is `copy_manual`, the item is explicitly marked `manual_edit_required` and the master is never overwritten.
8. Final creative URLs/IDs must be stored before the creative is treated as externally rendered.


## Publishing Provider Layer

The Social Media OS now has a provider-agnostic publishing queue.

### Buffer adapter

Server-only endpoints:
- `GET /api/social/providers/buffer/status` — checks whether Buffer is configured and discovers organizations/channels.
- `POST /api/social/providers/buffer/map` — maps one discovered Buffer channel to one selected brand.
- `POST /api/social/publish/dispatch` — atomically claims a queue item and schedules it in Buffer.
- `POST /api/social/publish/reconcile` — checks Buffer after dispatch and only marks the item published after Buffer reports `sent`.

Runtime secret:
- `BUFFER_API_KEY` must be configured in Vercel Production/Preview as appropriate.
- The key is server-side only and is never returned to the browser or stored in Social Media OS tables.

Publishing safety:
- Only approved or scheduled content can enter the queue.
- Brand, campaign, account, platform and pause state are revalidated by the database RPC.
- Queue entries use an idempotency key to avoid duplicate dispatch.
- A Buffer `createPost` success is stored as `enviado_api`, not `publicado`.
- Publication becomes `publicado` only after reconciliation observes Buffer status `sent`.
- Failed attempts are recorded with exponential retry metadata.
- Instagram, TikTok, Pinterest and YouTube are deliberately blocked by the text-only worker until media-specific dispatch is implemented.

### Current external blocker

If `BUFFER_API_KEY` is absent from the Vercel environment, the dashboard displays the blocker and dispatch buttons remain disabled. No post is consumed from the queue in that state.
