import { NextResponse } from 'next/server'
import { bufferConfigured } from '@/lib/social-providers/buffer'
import {
  adminSupabaseConfigured,
  createSupabaseAdminClient,
} from '@/lib/supabase-admin'
import { syncMetricsByQueueId } from '@/lib/social-metrics-worker'

export const maxDuration = 60

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: 'CRON_SECRET_missing' }, { status: 503 })
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!adminSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY_missing' }, { status: 503 })
  }
  if (!bufferConfigured()) {
    return NextResponse.json({ error: 'BUFFER_API_KEY_missing' }, { status: 503 })
  }

  const supabase = createSupabaseAdminClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString()

  const { data: queues, error: queueError } = await supabase
    .from('sm_queue')
    .select('id,confirmed_at')
    .eq('status', 'publicado')
    .not('external_post_id', 'is', null)
    .gte('confirmed_at', since)
    .order('confirmed_at', { ascending: false })
    .limit(100)

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 })
  }

  const ids = (queues ?? []).map((item) => item.id)
  const { data: syncs } = ids.length
    ? await supabase
        .from('sm_metric_syncs')
        .select('queue_id,last_synced_at,status')
        .in('queue_id', ids)
    : { data: [] as Array<{ queue_id: string; last_synced_at: string; status: string }> }

  const syncMap = new Map((syncs ?? []).map((item) => [item.queue_id, item]))
  const candidates = (queues ?? [])
    .map((item) => ({
      ...item,
      sync: syncMap.get(item.id),
    }))
    .sort((a, b) => {
      const at = a.sync?.last_synced_at ? new Date(a.sync.last_synced_at).getTime() : 0
      const bt = b.sync?.last_synced_at ? new Date(b.sync.last_synced_at).getTime() : 0
      return at - bt
    })
    .slice(0, 30)

  const results: Array<Record<string, unknown>> = []
  const errors: Array<{ queue_id: string; error: string }> = []

  for (const item of candidates) {
    try {
      results.push(await syncMetricsByQueueId(supabase, item.id))
    } catch (error) {
      errors.push({
        queue_id: item.id,
        error: error instanceof Error ? error.message : 'metric_sync_failed',
      })
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    ran_at: new Date().toISOString(),
    schedule: request.headers.get('x-vercel-cron-schedule'),
    candidates: candidates.length,
    results,
    errors,
  })
}
