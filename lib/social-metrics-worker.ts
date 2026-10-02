import type { SupabaseClient } from '@supabase/supabase-js'
import { getBufferPostMetrics } from '@/lib/social-providers/buffer'

export async function syncMetricsByQueueId(
  supabase: SupabaseClient,
  queueId: string,
) {
  const { data: queue, error: queueError } = await supabase
    .from('sm_queue')
    .select('id,content_id,brand_id,account_id,external_post_id,external_url,status,confirmed_at')
    .eq('id', queueId)
    .single()

  if (queueError || !queue) throw new Error('queue_not_accessible')
  if (!queue.external_post_id) throw new Error('external_post_id_missing')
  if (queue.status !== 'publicado') throw new Error('metrics_require_published_post')

  const { data: account, error: accountError } = await supabase
    .from('sm_accounts')
    .select('provider')
    .eq('id', queue.account_id)
    .single()

  if (accountError || !account) throw new Error('account_not_accessible')
  if ((account.provider || 'buffer') !== 'buffer') {
    throw new Error('metrics_provider_not_supported')
  }

  const syncedAt = new Date().toISOString()

  try {
    const post = await getBufferPostMetrics(queue.external_post_id)

    if (!post) {
      await supabase.from('sm_metric_syncs').upsert(
        {
          queue_id: queue.id,
          content_id: queue.content_id,
          brand_id: queue.brand_id,
          provider: 'buffer',
          status: 'error',
          metrics_updated_at: null,
          last_synced_at: syncedAt,
          last_error: 'buffer_post_not_found',
          detail: {},
        },
        { onConflict: 'queue_id' },
      )
      return { queue_id: queue.id, status: 'error', metric_count: 0 }
    }

    if (post.externalLink && !queue.external_url) {
      await supabase
        .from('sm_queue')
        .update({ external_url: post.externalLink, updated_at: syncedAt })
        .eq('id', queue.id)
    }

    if (post.metrics === null || post.metrics === undefined || !post.metricsUpdatedAt) {
      await supabase.from('sm_metric_syncs').upsert(
        {
          queue_id: queue.id,
          content_id: queue.content_id,
          brand_id: queue.brand_id,
          provider: 'buffer',
          status: 'pending',
          metrics_updated_at: post.metricsUpdatedAt || null,
          last_synced_at: syncedAt,
          last_error: null,
          detail: { reason: 'buffer_metrics_not_ingested_yet' },
        },
        { onConflict: 'queue_id' },
      )
      return { queue_id: queue.id, status: 'pending', metric_count: 0 }
    }

    if (post.metrics.length === 0) {
      await supabase.from('sm_metric_syncs').upsert(
        {
          queue_id: queue.id,
          content_id: queue.content_id,
          brand_id: queue.brand_id,
          provider: 'buffer',
          status: 'no_data',
          metrics_updated_at: post.metricsUpdatedAt,
          last_synced_at: syncedAt,
          last_error: null,
          detail: { reason: 'provider_returned_empty_metric_set' },
        },
        { onConflict: 'queue_id' },
      )
      return { queue_id: queue.id, status: 'no_data', metric_count: 0 }
    }

    const collectedOn = post.metricsUpdatedAt.slice(0, 10)
    const rows = post.metrics
      .filter((metric) => Number.isFinite(Number(metric.value)))
      .map((metric) => ({
        queue_id: queue.id,
        content_id: queue.content_id,
        brand_id: queue.brand_id,
        metric_type: metric.type,
        metric_name: metric.name || null,
        value: Number(metric.value),
        unit: metric.unit || null,
        collected_on: collectedOn,
        source: 'buffer',
        metrics_updated_at: post.metricsUpdatedAt,
        collected_at: syncedAt,
      }))

    if (rows.length > 0) {
      const { error: metricError } = await supabase
        .from('sm_metrics')
        .upsert(rows, { onConflict: 'queue_id,metric_type,collected_on' })
      if (metricError) throw metricError
    }

    await supabase.from('sm_metric_syncs').upsert(
      {
        queue_id: queue.id,
        content_id: queue.content_id,
        brand_id: queue.brand_id,
        provider: 'buffer',
        status: rows.length ? 'observed' : 'no_data',
        metrics_updated_at: post.metricsUpdatedAt,
        last_synced_at: syncedAt,
        last_error: null,
        detail: {
          metric_count: rows.length,
          external_link: post.externalLink || null,
        },
      },
      { onConflict: 'queue_id' },
    )

    return {
      queue_id: queue.id,
      status: rows.length ? 'observed' : 'no_data',
      metric_count: rows.length,
      metrics_updated_at: post.metricsUpdatedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'metric_sync_failed'
    await supabase.from('sm_metric_syncs').upsert(
      {
        queue_id: queue.id,
        content_id: queue.content_id,
        brand_id: queue.brand_id,
        provider: 'buffer',
        status: 'error',
        metrics_updated_at: null,
        last_synced_at: syncedAt,
        last_error: message,
        detail: {},
      },
      { onConflict: 'queue_id' },
    )
    throw error
  }
}
