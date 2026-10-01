import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { bufferConfigured, listAllBufferChannels } from '@/lib/social-providers/buffer'

const serviceMap: Record<string, string> = {
  twitter: 'x',
  x: 'x',
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  threads: 'threads',
  youtube: 'youtube',
  pinterest: 'pinterest',
  bluesky: 'bluesky',
  googlebusiness: 'googlebusiness',
  google_business: 'googlebusiness',
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

  const body = (await request.json().catch(() => null)) as
    | { brand_id?: string; channel_id?: string }
    | null
  const brandId = body?.brand_id?.trim()
  const channelId = body?.channel_id?.trim()
  if (!brandId || !channelId) {
    return NextResponse.json({ error: 'brand_id_and_channel_id_required' }, { status: 400 })
  }

  const { data: brand, error: brandError } = await supabase
    .from('sm_brands')
    .select('id,slug,name')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    return NextResponse.json({ error: 'brand_not_accessible' }, { status: 403 })
  }

  try {
    const groups = await listAllBufferChannels()
    const found = groups
      .flatMap(({ organization, channels }) =>
        channels.map((channel) => ({ organization, channel })),
      )
      .find(({ channel }) => channel.id === channelId)

    if (!found) return NextResponse.json({ error: 'channel_not_found' }, { status: 404 })

    const platform = serviceMap[found.channel.service.toLowerCase()]
    if (!platform) {
      return NextResponse.json(
        { error: 'unsupported_channel_service', service: found.channel.service },
        { status: 400 },
      )
    }

    const connected = !found.channel.isDisconnected && !found.channel.isLocked
    const handle = found.channel.name || found.channel.displayName || found.channel.id

    const { data: account, error: upsertError } = await supabase
      .from('sm_accounts')
      .upsert(
        {
          brand_id: brandId,
          platform,
          handle,
          url: found.channel.externalLink || null,
          buffer_channel_id: found.channel.id,
          provider: 'buffer',
          provider_channel_id: found.channel.id,
          provider_meta: {
            organization_id: found.organization.id,
            organization_name: found.organization.name,
            display_name: found.channel.displayName,
            service: found.channel.service,
            avatar: found.channel.avatar,
            queue_paused: found.channel.isQueuePaused,
          },
          status: connected ? 'conectada' : 'desconectada',
          paused: Boolean(found.channel.isQueuePaused),
        },
        { onConflict: 'brand_id,platform,handle' },
      )
      .select('*')
      .single()

    if (upsertError) throw upsertError
    return NextResponse.json({ ok: true, account })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'buffer_channel_map_failed' },
      { status: 502 },
    )
  }
}
