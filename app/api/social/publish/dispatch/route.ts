import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  bufferConfigured,
  createBufferScheduledPost,
} from '@/lib/social-providers/buffer'

const textOnlySupported = new Set([
  'x',
  'linkedin',
  'facebook',
  'threads',
  'bluesky',
  'googlebusiness',
])

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
    caption: string
    due_at: string
    attempt_no: number
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

  if (!textOnlySupported.has(job.platform)) {
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: 'media_dispatch_required',
      p_detail: { platform: job.platform },
    })
    return NextResponse.json(
      {
        error: 'media_dispatch_required',
        platform: job.platform,
        message: 'This platform requires media-specific dispatch and was not sent as text-only.',
      },
      { status: 422 },
    )
  }

  try {
    const post = await createBufferScheduledPost({
      channelId: job.provider_channel_id,
      text: job.caption,
      dueAt: new Date(job.due_at).toISOString(),
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
      },
    })

    return NextResponse.json({
      ok: true,
      queue_id: job.queue_id,
      provider: 'buffer',
      external_post_id: post.id,
      status: post.status || 'scheduled',
      due_at: post.dueAt || job.due_at,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'buffer_dispatch_failed'
    await supabase.rpc('sm_finish_queue', {
      p_queue_id: job.queue_id,
      p_outcome: 'error',
      p_error: message,
      p_detail: { provider: 'buffer' },
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
