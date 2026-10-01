import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { bufferConfigured } from '@/lib/social-providers/buffer'
import { adminSupabaseConfigured } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  return NextResponse.json({
    worker: 'social-publishing',
    ready:
      Boolean(process.env.CRON_SECRET?.trim()) &&
      adminSupabaseConfigured() &&
      bufferConfigured(),
    checks: {
      cron_secret: Boolean(process.env.CRON_SECRET?.trim()),
      supabase_service_role: adminSupabaseConfigured(),
      buffer_api_key: bufferConfigured(),
    },
    schedule: '*/5 * * * *',
  })
}
