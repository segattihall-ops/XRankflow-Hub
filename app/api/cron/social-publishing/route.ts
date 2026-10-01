import { NextResponse } from 'next/server'
import { bufferConfigured } from '@/lib/social-providers/buffer'
import {
  adminSupabaseConfigured,
  createSupabaseAdminClient,
} from '@/lib/supabase-admin'
import {
  dispatchQueueById,
  reconcileQueueById,
} from '@/lib/social-publish-worker'

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
  const now = new Date()
  const nowIso = now.toISOString()
  const staleBefore = new Date(now.getTime() - 15 * 60_000).toISOString()

  const summary: {
    recovered: number
    dispatched: Array<Record<string, unknown>>
    reconciled: Array<Record<string, unknown>>
    alerts: number
    errors: Array<{ queue_id?: string; stage: string; error: string }>
  } = {
    recovered: 0,
    dispatched: [],
    reconciled: [],
    alerts: 0,
    errors: [],
  }

  const { data: staleJobs } = await supabase
    .from('sm_queue')
    .select('id')
    .eq('status', 'processando')
    .lt('locked_at', staleBefore)
    .limit(20)

  for (const job of staleJobs ?? []) {
    const { error } = await supabase
      .from('sm_queue')
      .update({
        status: 'incerto',
        locked_at: null,
        last_error: 'stale_processing_lock_recovered',
        updated_at: nowIso,
      })
      .eq('id', job.id)
      .eq('status', 'processando')

    if (!error) summary.recovered += 1
  }

  const { data: dispatchCandidates, error: dispatchQueryError } = await supabase
    .from('sm_queue')
    .select('id,status,due_at,attempts,max_attempts,next_attempt_at')
    .in('status', ['pendente', 'falhou', 'incerto'])
    .lte('due_at', nowIso)
    .order('due_at', { ascending: true })
    .limit(25)

  if (dispatchQueryError) {
    summary.errors.push({ stage: 'dispatch_query', error: dispatchQueryError.message })
  } else {
    const ready = (dispatchCandidates ?? [])
      .filter((job) => job.attempts < job.max_attempts)
      .filter((job) => !job.next_attempt_at || new Date(job.next_attempt_at) <= now)
      .slice(0, 8)

    for (const job of ready) {
      try {
        const result = await dispatchQueueById(supabase, job.id)
        summary.dispatched.push(result)
      } catch (error) {
        summary.errors.push({
          queue_id: job.id,
          stage: 'dispatch',
          error: error instanceof Error ? error.message : 'dispatch_failed',
        })
      }
    }
  }

  const { data: reconcileCandidates, error: reconcileQueryError } = await supabase
    .from('sm_queue')
    .select('id,due_at')
    .eq('status', 'enviado_api')
    .lte('due_at', nowIso)
    .order('due_at', { ascending: true })
    .limit(12)

  if (reconcileQueryError) {
    summary.errors.push({ stage: 'reconcile_query', error: reconcileQueryError.message })
  } else {
    for (const job of reconcileCandidates ?? []) {
      try {
        const result = await reconcileQueueById(supabase, job.id)
        summary.reconciled.push(result)
      } catch (error) {
        summary.errors.push({
          queue_id: job.id,
          stage: 'reconcile',
          error: error instanceof Error ? error.message : 'reconcile_failed',
        })
      }
    }
  }

  const { data: exhaustedJobs } = await supabase
    .from('sm_queue')
    .select('id,brand_id,last_error,attempts,max_attempts')
    .eq('status', 'falhou')
    .limit(50)

  for (const job of (exhaustedJobs ?? []).filter((item) => item.attempts >= item.max_attempts)) {
    const { error } = await supabase.from('sm_alerts').upsert(
      {
        brand_id: job.brand_id,
        queue_id: job.id,
        severity: 'erro',
        title: 'Publicação esgotou as tentativas automáticas',
        action: job.last_error || 'Revisar credenciais, mídia, canal e conteúdo antes de reenviar.',
        dedupe_key: `publish-max-attempts:${job.id}`,
      },
      { onConflict: 'dedupe_key' },
    )
    if (!error) summary.alerts += 1
  }

  return NextResponse.json({
    ok: summary.errors.length === 0,
    ran_at: nowIso,
    schedule: request.headers.get('x-vercel-cron-schedule'),
    summary,
  })
}
