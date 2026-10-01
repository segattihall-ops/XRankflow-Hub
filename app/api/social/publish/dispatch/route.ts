import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  bufferConfigured,
  createBufferScheduledPost,
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

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!bufferConfigured()) {
    return NextResponse.json({ error: 'BUFFER_API_KEY_missing' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as { queue_id?: string } | null
  const queueId = body?.queue_id?.trim()
  if (!queueId) return NextResponse.json({ error: 'queue_id_required' }, { status: 400 })

  const { data: claimed, error: claimError } = await supabase.rpc('sm_claim_queue', {
    p_queue_id: queueId,
  })

  if (claimError || !claimed) {
    return NextResponse.json(
      { error: claimError?.message || 'queue_claim_failed' },
      { status: 409 },
    )
  }

  const job = claimed as {
    queue_id: string
    provider: string
    provider_channel_id: string
    platform: string
    format: string
    caption: string
    due_at: string
    attempt_no: number
    creative_assets?: unknown
  }

  if (job.provider !== 'buffer') {
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: 'provider_not_supported_by_worker',
      p_detail: { provider: job.provider },
    })
    return NextResponse.json({ error: 'provider_not_supported_by_worker' }, { status: 501 })
  }

  if (specialMetadataRequired.has(job.platform)) {
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: 'platform_metadata_required',
      p_detail: { platform: job.platform },
    })
    return NextResponse.json(
      {
        error: 'platform_metadata_required',
        platform: job.platform,
        message: 'This platform needs channel-specific publishing metadata before automatic dispatch is enabled.',
      },
      { status: 422 },
    )
  }

  const assets = normalizeAssets(job.creative_assets)

  if (mediaRequired.has(job.platform) && assets.length === 0) {
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: 'public_media_asset_required',
      p_detail: { platform: job.platform },
    })
    return NextResponse.json(
      {
        error: 'public_media_asset_required',
        platform: job.platform,
        message: 'Instagram and TikTok require at least one public HTTPS image or video asset.',
      },
      { status: 422 },
    )
  }

  if (job.platform === 'instagram' && job.format === 'video_curto' && !assets.some((asset) => asset.type === 'video')) {
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: 'instagram_reel_video_required',
      p_detail: { platform: job.platform, format: job.format },
    })
    return NextResponse.json({ error: 'instagram_reel_video_required' }, { status: 422 })
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

    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'scheduled',
      p_external_post_id: post.id,
      p_error: null,
      p_detail: {
        provider: 'buffer',
        buffer_status: post.status || 'scheduled',
        buffer_due_at: post.dueAt || job.due_at,
        asset_count: assets.length,
      },
    })

    return NextResponse.json({
      ok: true,
      queue_id: job.queue_id,
      provider: 'buffer',
      external_post_id: post.id,
      status: post.status || 'scheduled',
      due_at: post.dueAt || job.due_at,
      asset_count: assets.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'buffer_dispatch_failed'
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: message,
      p_detail: { provider: 'buffer', asset_count: assets.length },
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
