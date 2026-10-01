# Universal Inbox Foundation

## Outcome

The XRANKFLOW OS now has a normalized, source-traceable inbox model without pretending that email/support/CRM connectors are already connected.

## Normalized store

Table: `xrmg_inbox_items`

Identity:
- `source_system`
- `source_item_id`

The pair is unique and is the deduplication key.

Core fields include source/thread IDs, brand scope, kind, sender, subject, preview, received timestamp, status, priority, capabilities, source URL and metadata.

## Security

- RLS is enabled.
- Authenticated WorkHub members can read normalized items.
- Browser clients cannot insert/update/delete inbox rows.
- Future ingestion must use a trusted server-side connector.
- Original-source actions stay disabled until a connector explicitly declares the capability.

## Current state

The normalized model and read UI are implemented.
External ingestion is not yet connected, so an empty XRANKFLOW Inbox must not be interpreted as an empty Gmail/support/CRM inbox.
