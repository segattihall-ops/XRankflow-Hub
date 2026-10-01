import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sourceRegistry } from '@/lib/source-registry'

type Command = 'attention' | 'overdue' | 'health' | 'company_status' | 'source_lookup'

async function getSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njwqeulzythluenexdcw.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq'

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(items) {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })

  const command = body.command as Command
  if (!['attention','overdue','health','company_status','source_lookup'].includes(command)) {
    return NextResponse.json({ error: 'Comando read-only não suportado.' }, { status: 400 })
  }

  const supabase = await getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Sessão não autorizada.' }, { status: 401 })

  const generatedAt = new Date().toISOString()
  const today = generatedAt.slice(0,10)

  if (command === 'overdue') {
    const { data, error } = await supabase
      .from('wh_tasks')
      .select('id,title,status,priority,due_date,brand_id,project_id,owner_role')
      .lt('due_date', today)
      .neq('status','Done')
      .order('due_date',{ascending:true})
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({
      command,
      generated_at: generatedAt,
      sources: ['wh_tasks'],
      result: { overdue_tasks: data || [] },
    })
  }

  if (command === 'attention') {
    const [tasksRes,kpisRes,incidentsRes] = await Promise.all([
      supabase.from('wh_tasks').select('id,title,status,priority,due_date,brand_id,project_id,owner_role').neq('status','Done').limit(200),
      supabase.from('wh_kpis').select('id,metric,health,target,actual,brand_id,period').limit(100),
      supabase.from('xrmg_incident_register').select('id,company_key,severity,title,status,detected_at,source').order('detected_at',{ascending:false}).limit(50),
    ])
    const first = tasksRes.error || kpisRes.error || incidentsRes.error
    if (first) return NextResponse.json({ error: first.message }, { status: 400 })

    const tasks = tasksRes.data || []
    const overdue = tasks.filter(t => t.due_date && t.due_date < today)
    const highPriority = tasks.filter(t => t.priority === 'High')
    const riskKpis = (kpisRes.data || []).filter(k => k.health === 'At Risk' || k.health === 'Off Track')
    const activeIncidents = (incidentsRes.data || []).filter(i => !['closed','resolved','done'].includes(String(i.status).toLowerCase()))

    return NextResponse.json({
      command,
      generated_at: generatedAt,
      sources: ['wh_tasks','wh_kpis','xrmg_incident_register'],
      result: {
        overdue_tasks: overdue,
        high_priority_tasks: highPriority,
        kpis_at_risk: riskKpis,
        active_incidents: activeIncidents,
      },
    })
  }

  if (command === 'health') {
    const [checksRes,incidentsRes] = await Promise.all([
      supabase.from('xrmg_system_checks').select('id,system_key,check_key,status,checked_at,expires_at,summary,source').order('checked_at',{ascending:false}),
      supabase.from('xrmg_incident_register').select('id,company_key,severity,title,status,detected_at,source').order('detected_at',{ascending:false}).limit(50),
    ])
    const first = checksRes.error || incidentsRes.error
    if (first) return NextResponse.json({ error: first.message }, { status: 400 })

    const now = Date.now()
    const checks = (checksRes.data || []).map(check => ({
      ...check,
      freshness: new Date(check.expires_at).getTime() <= now ? 'stale' : 'current',
    }))
    const activeIncidents = (incidentsRes.data || []).filter(i => !['closed','resolved','done'].includes(String(i.status).toLowerCase()))

    return NextResponse.json({
      command,
      generated_at: generatedAt,
      sources: ['xrmg_system_checks','xrmg_incident_register'],
      result: { checks, active_incidents: activeIncidents },
    })
  }

  if (command === 'company_status') {
    const slug = normalize(body.brand_slug)
    if (!slug) return NextResponse.json({ error: 'Selecione uma empresa.' }, { status: 400 })

    const brandRes = await supabase.from('wh_brands').select('*').eq('slug',slug).single()
    if (brandRes.error || !brandRes.data) {
      return NextResponse.json({ error: 'Empresa não encontrada ou não autorizada.' }, { status: 404 })
    }

    const brand = brandRes.data
    const [tasksRes,projectsRes,kpisRes] = await Promise.all([
      supabase.from('wh_tasks').select('id,title,status,priority,due_date,project_id,owner_role').eq('brand_id',brand.id),
      supabase.from('wh_projects').select('id,name,status,owner,next_step').eq('brand_id',brand.id),
      supabase.from('wh_kpis').select('id,metric,health,target,actual,period').eq('brand_id',brand.id),
    ])
    const first = tasksRes.error || projectsRes.error || kpisRes.error
    if (first) return NextResponse.json({ error: first.message }, { status: 400 })

    const tasks = tasksRes.data || []
    const kpis = kpisRes.data || []

    return NextResponse.json({
      command,
      generated_at: generatedAt,
      sources: ['wh_brands','wh_tasks','wh_projects','wh_kpis'],
      result: {
        brand,
        summary: {
          open_tasks: tasks.filter(t => t.status !== 'Done').length,
          overdue_tasks: tasks.filter(t => t.status !== 'Done' && t.due_date && t.due_date < today).length,
          projects: (projectsRes.data || []).length,
          kpis_at_risk: kpis.filter(k => k.health === 'At Risk' || k.health === 'Off Track').length,
        },
        tasks,
        projects: projectsRes.data || [],
        kpis,
      },
    })
  }

  const sourceKey = normalize(body.source_key)
  const source = sourceRegistry.find(item =>
    item.key.toLowerCase() === sourceKey || item.name.toLowerCase() === sourceKey
  )

  if (!source) return NextResponse.json({ error: 'Fonte não encontrada no registro.' }, { status: 404 })

  return NextResponse.json({
    command,
    generated_at: generatedAt,
    sources: ['lib/source-registry.ts'],
    result: { source },
  })
}
