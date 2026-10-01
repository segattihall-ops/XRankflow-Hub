import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  bufferConfigured,
  listAllBufferChannels,
} from '@/lib/social-providers/buffer'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!bufferConfigured()) {
    return NextResponse.json({
      configured: false,
      provider: 'buffer',
      blocker: 'BUFFER_API_KEY_missing',
      organizations: [],
    })
  }

  try {
    const organizations = await listAllBufferChannels()
    return NextResponse.json({
      configured: true,
      provider: 'buffer',
      organizations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        provider: 'buffer',
        error: error instanceof Error ? error.message : 'buffer_status_failed',
      },
      { status: 502 },
    )
  }
}
