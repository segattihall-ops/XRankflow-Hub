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

## External connection status

Buffer OAuth connections are available in ChatGPT and were used to verify the real channel IDs for MasseurMatch and Voxmation. The production Social Media OS worker does not reuse ChatGPT OAuth tokens. Each Buffer account must therefore receive its own personal Buffer API key through the **Conexões Buffer** panel. Keys are written directly to Supabase Vault and are never returned to the browser after saving.


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

The production publisher runs in **Supabase**, not in the browser and not in Vercel Cron.

### Runtime architecture

- `pg_cron` runs `public.sm_cron_tick('run')` every 5 minutes.
- `pg_cron` runs `public.sm_cron_tick('metrics')` daily.
- `pg_net` invokes the `sm-publisher` Supabase Edge Function.
- The Edge Function authenticates cron calls with the encrypted `sm_cron_secret` stored in Supabase Vault.
- The Edge Function uses Supabase's server-side service role internally; no service-role key is exposed to the application.
- Buffer API keys are stored per provider connection in Supabase Vault.
- One brand can have its own Buffer account/credential without sharing a key with another brand.

### Current verified Buffer accounts

MasseurMatch:
- Instagram channel mapped.
- Facebook channel mapped.
- Buffer organization ID stored.
- API-key credential slot created in Vault-backed connection settings.

Voxmation:
- Instagram channel mapped.
- Facebook channel mapped.
- LinkedIn channel mapped.
- Buffer organization ID stored.
- API-key credential slot created in Vault-backed connection settings.

The ChatGPT Buffer OAuth connection is intentionally not copied into the application. The production worker requires the account owner's personal Buffer API key once per Buffer account.

### Publishing safety

- Only approved/scheduled content is eligible for the queue.
- Brand, campaign, account, pause state, version, provider connection, and platform are validated.
- The approved queue snapshot is immutable.
- Queue items use idempotency keys.
- `createPost` success becomes `enviado_api`, never `publicado`.
- `publicado` requires a later provider confirmation that Buffer reports `sent`.
- Network/5xx ambiguity moves the item to `incerto` and reconciles before any resend.
- Rate-limit/auth failures pause only the affected provider connection within that worker run.
- Exhausted attempts create an operational alert.
- Cancellation requires remote confirmation.
- Multi-account credentials are isolated by brand/provider connection.

### Credential workflow

1. Select a brand.
2. Open **Conexões Buffer desta marca**.
3. Click **Adicionar API key**.
4. Paste the Buffer API key from Buffer Settings → API.
5. The browser sends it directly to the `sm_upsert_buffer_connection` RPC over TLS.
6. The RPC stores it encrypted in Supabase Vault.
7. `sm-publisher` verifies the key against Buffer, confirms the organization, and synchronizes channels.
8. The UI never reads the stored key back.


## Media dispatch

Creative content can now store ordered public media in `sm_content.creative_assets`.

Each asset is structured as:
- `type: image | video`
- `url: public HTTPS URL`
- optional `thumbnailOffset` for video

Rules:
- Buffer must be able to fetch the URL without authentication.
- The OS rejects localhost/private-network and non-HTTPS media URLs.
- Instagram and TikTok require at least one media asset.
- Instagram `video_curto` requires a video asset and is dispatched as a Reel.
- Instagram carousels can carry multiple ordered image assets.
- Text-capable networks may optionally include media.
- Pinterest and YouTube remain blocked until their required channel-specific metadata is collected and validated.

Canva edit/view links are not treated as publishable media files unless they resolve to a direct, public file URL. The Creative Queue records direct media URLs separately.


## Metrics and optimization

Buffer post metrics are synchronized from the provider instead of inferred locally.

Data quality rules:
- `observed`: the provider returned one or more metric values.
- `pending`: Buffer has not populated `metricsUpdatedAt`/metrics yet.
- `no_data`: the provider returned an explicit empty metric set.
- `error`: the provider request failed or the post could not be resolved.
- Missing data is never converted to zero.

Storage:
- `sm_metrics` stores observed metric snapshots at the provider's `metricsUpdatedAt` date.
- `sm_metric_syncs` stores freshness and sync health per published queue item.
- Client users have read-only access through brand-scoped RLS.
- Writes are performed by the server-side metrics worker.

Automation:
- Supabase `pg_cron` calls `sm_cron_tick('metrics')` daily.
- The Supabase Edge Function reads each published post using that post's own provider connection/credential.
- Published posts from the last 90 days are eligible for refresh.
- Metrics are stored as provider observations with explicit `observed`, `pending`, `no_data`, and `error` states.
- Buffer metrics can be delayed by roughly 24 hours, so the UI shows provider freshness separately from local sync time.

The dashboard aggregates only the latest observed snapshot per content/metric type and labels the result as an observed summary, not a causal performance conclusion.
