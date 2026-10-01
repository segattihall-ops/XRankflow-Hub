import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { bufferConfigured, findBufferPost } from '@/lib/social-providers/buffer'

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

  const { data: queue, error: queueError } = await supabase
    .from('sm_queue')
    .select('id,brand_id,account_id,external_post_id,status')
    .eq('id', queueId)
    .single()

  if (queueError || !queue) {
    return NextResponse.json({ error: 'queue_not_accessible' }, { status: 404 })
  }
  if (!queue.external_post_id) {
    return NextResponse.json({ error: 'external_post_id_missing' }, { status: 409 })
  }

  const { data: account, error: accountError } = await supabase
    .from('sm_accounts')
    .select('provider,provider_channel_id,buffer_channel_id,provider_meta')
    .eq('id', queue.account_id)
    .single()

  if (accountError || !account) {
    return NextResponse.json({ error: 'account_not_accessible' }, { status: 404 })
  }
  if ((account.provider || 'buffer') !== 'buffer') {
    return NextResponse.json({ error: 'provider_not_supported_by_reconciler' }, { status: 501 })
  }

  const meta = (account.provider_meta || {}) as Record<string, unknown>
  const organizationId = typeof meta.organization_id === 'string' ? meta.organization_id : ''
  const channelId = account.provider_channel_id || account.buffer_channel_id || ''
  if (!organizationId || !channelId) {
    return NextResponse.json({ error: 'buffer_account_metadata_incomplete' }, { status: 409 })
  }

  try {
    const post = await findBufferPost({
      organizationId,
      channelId,
      postId: queue.external_post_id,
    })

    if (!post) {
      return NextResponse.json({
        ok: true,
        queue_id: queue.id,
        status: 'unknown',
        message: 'Post was not found in the latest Buffer result window. Queue state was not changed.',
      })
    }

    if (post.status === 'sent') {
      await supabase.rpc('sm_finish_queue', {
        p_queue_id: queue.id,
        p_outcome: 'published',
        p_external_post_id: queue.external_post_id,
        p_error: null,
        p_detail: { provider: 'buffer', buffer_status: post.status, sent_at: post.sentAt },
      })
    } else if (post.status === 'error') {
      await supabase.rpc('sm_finish_queue', {
        p_queue_id: queue.id,
        p_outcome: 'error',
        p_external_post_id: queue.external_post_id,
        p_error: 'buffer_post_error',
        p_detail: { provider: 'buffer', buffer_status: post.status },
      })
    }

    return NextResponse.json({
      ok: true,
      queue_id: queue.id,
      status: post.status || 'unknown',
      due_at: post.dueAt || null,
      sent_at: post.sentAt || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'buffer_reconcile_failed' },
      { status: 502 },
    )
  }
}
