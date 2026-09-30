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
