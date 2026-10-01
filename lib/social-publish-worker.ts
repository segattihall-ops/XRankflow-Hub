import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createBufferScheduledPost,
  findBufferPost,
  type BufferCreativeAsset,
} from '@/lib/social-providers/buffer'

const mediaRequired = new Set(['instagram', 'tiktok'])
const specialMetadataRequired = new Set(['pinterest', 'youtube'])

function isSafePublicMediaUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1'
    ) return false
    if (/^10\./.test(host) || /^192\.168\./.test(host)) return false
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false
    return true
  } catch {
    return false
  }
}

function normalizeAssets(input: unknown): BufferCreativeAsset[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const type = record.type === 'video' ? 'video' : record.type === 'image' ? 'image' : null
    const url = typeof record.url === 'string' ? record.url.trim() : ''
    if (!type || !url || !isSafePublicMediaUrl(url)) return []
    const thumbnailOffset =
      typeof record.thumbnailOffset === 'number' && Number.isFinite(record.thumbnailOffset)
        ? Math.max(0, Math.floor(record.thumbnailOffset))
        : undefined
    return [{ type, url, ...(thumbnailOffset !== undefined ? { thumbnailOffset } : {}) }]
  })
}

async function finish(
  supabase: SupabaseClient,
  queueId: string,
  outcome: 'published' | 'scheduled' | 'unknown' | 'error',
  options: {
    externalPostId?: string | null
    externalUrl?: string | null
    error?: string | null
    detail?: Record<string, unknown>
  } = {},
) {
  const { error } = await supabase.rpc('sm_finish_queue', {
    p_queue_id: queueId,
    p_outcome: outcome,
    p_external_post_id: options.externalPostId ?? null,
    p_external_url: options.externalUrl ?? null,
    p_error: options.error ?? null,
    p_detail: options.detail ?? {},
  })
  if (error) throw error
}

export async function dispatchQueueById(supabase: SupabaseClient, queueId: string) {
  const { data: claimed, error: claimError } = await supabase.rpc('sm_claim_queue', {
    p_queue_id: queueId,
  })
  if (claimError || !claimed) {
    throw new Error(claimError?.message || 'queue_claim_failed')
  }

  const job = claimed as {
    queue_id: string
    provider: string
    provider_channel_id: string
    platform: string
    format: string
    caption: string
    due_at: string
    creative_assets?: unknown
  }

  if (job.provider !== 'buffer') {
    await finish(supabase, job.queue_id, 'error', {
      error: 'provider_not_supported_by_worker',
      detail: { provider: job.provider },
    })
    return { queue_id: job.queue_id, status: 'error', error: 'provider_not_supported_by_worker' }
  }

  if (specialMetadataRequired.has(job.platform)) {
    await finish(supabase, job.queue_id, 'error', {
      error: 'platform_metadata_required',
      detail: { platform: job.platform },
    })
    return { queue_id: job.queue_id, status: 'error', error: 'platform_metadata_required' }
  }

  const assets = normalizeAssets(job.creative_assets)

  if (mediaRequired.has(job.platform) && assets.length === 0) {
    await finish(supabase, job.queue_id, 'error', {
      error: 'public_media_asset_required',
      detail: { platform: job.platform },
    })
    return { queue_id: job.queue_id, status: 'error', error: 'public_media_asset_required' }
  }

  if (
    job.platform === 'instagram' &&
    job.format === 'video_curto' &&
    !assets.some((asset) => asset.type === 'video')
  ) {
    await finish(supabase, job.queue_id, 'error', {
      error: 'instagram_reel_video_required',
      detail: { platform: job.platform, format: job.format },
    })
    return { queue_id: job.queue_id, status: 'error', error: 'instagram_reel_video_required' }
  }

  try {
    const post = await createBufferScheduledPost({
      channelId: job.provider_channel_id,
      text: job.caption,
      dueAt: new Date(job.due_at).toISOString(),
      platform: job.platform,
      format: job.format,
      assets,
    })

    await finish(supabase, job.queue_id, 'scheduled', {
      externalPostId: post.id,
      detail: {
        provider: 'buffer',
        buffer_status: post.status || 'scheduled',
        buffer_due_at: post.dueAt || job.due_at,
        asset_count: assets.length,
      },
    })

    return {
      queue_id: job.queue_id,
      status: 'scheduled',
      external_post_id: post.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'buffer_dispatch_failed'
    await finish(supabase, job.queue_id, 'error', {
      error: message,
      detail: { provider: 'buffer', asset_count: assets.length },
    })
    return { queue_id: job.queue_id, status: 'error', error: message }
  }
}

export async function reconcileQueueById(supabase: SupabaseClient, queueId: string) {
  const { data: queue, error: queueError } = await supabase
    .from('sm_queue')
    .select('id,brand_id,account_id,external_post_id,status,due_at')
    .eq('id', queueId)
    .single()

  if (queueError || !queue) throw new Error('queue_not_accessible')
  if (!queue.external_post_id) throw new Error('external_post_id_missing')

  const { data: account, error: accountError } = await supabase
    .from('sm_accounts')
    .select('provider,provider_channel_id,buffer_channel_id,provider_meta')
    .eq('id', queue.account_id)
    .single()

  if (accountError || !account) throw new Error('account_not_accessible')
  if ((account.provider || 'buffer') !== 'buffer') {
    throw new Error('provider_not_supported_by_reconciler')
  }

  const meta = (account.provider_meta || {}) as Record<string, unknown>
  const organizationId = typeof meta.organization_id === 'string' ? meta.organization_id : ''
  const channelId = account.provider_channel_id || account.buffer_channel_id || ''
  if (!organizationId || !channelId) throw new Error('buffer_account_metadata_incomplete')

  const post = await findBufferPost({
    organizationId,
    channelId,
    postId: queue.external_post_id,
  })

  if (!post) {
    return { queue_id: queue.id, status: 'unknown' }
  }

  if (post.status === 'sent') {
    await finish(supabase, queue.id, 'published', {
      externalPostId: queue.external_post_id,
      detail: { provider: 'buffer', buffer_status: post.status, sent_at: post.sentAt },
    })
  } else if (post.status === 'error') {
    await finish(supabase, queue.id, 'error', {
      externalPostId: queue.external_post_id,
      error: 'buffer_post_error',
      detail: { provider: 'buffer', buffer_status: post.status },
    })
  }

  return {
    queue_id: queue.id,
    status: post.status || 'unknown',
  }
}
