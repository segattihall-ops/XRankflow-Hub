import { NextRequest, NextResponse } from 'next/server'
import { isReadCommand, isRecord, isTimestamp, type ReadResponse } from '@/lib/ai-read-contract'
import { sourceRegistry, sourceStateLabel } from '@/lib/source-registry'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const scope = 'Registros visíveis para esta sessão, sob as regras de acesso da fonte. Prazos avaliados em UTC.'
const healthLimit = 200
type DatabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>
type CountResult = { count: number | null; error: unknown }

function json(body: ReadResponse | { error: string }, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function countOf(result: CountResult) {
  if (result.error || !Number.isSafeInteger(result.count) || result.count === null || result.count < 0) {
    throw new Error('Source count unavailable')
  }
  return result.count
}

function taskCount(client: DatabaseClient) {
  return client.from('wh_tasks').select('id', { count: 'exact', head: true })
    .or('status.is.null,status.neq.Done')
}

function incidentCount(client: DatabaseClient) {
  return client.from('xrmg_incident_register').select('id', { count: 'exact', head: true })
    .in('status', ['OPEN', 'INVESTIGATING', 'MITIGATING'])
}

function kpiRiskCount(client: DatabaseClient) {
  return client.from('wh_kpis').select('id', { count: 'exact', head: true })
    .in('health', ['At Risk', 'Off Track'])
}

function timestamp(value: unknown) {
  return isTimestamp(value) ? Date.parse(value) : NaN
}

function freshness(check: Record<string, unknown>, now: number) {
  const checked = timestamp(check.checked_at)
  const expires = timestamp(check.expires_at)
  if (!Number.isFinite(checked) || !Number.isFinite(expires) || checked > now || expires <= checked) return 'unknown'
  return expires <= now ? 'stale' : 'current'
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origem não permitida.' }, 403)

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body) || !isReadCommand(body.command)) return json({ error: 'Comando de consulta inválido.' }, 400)
  const command = body.command
  const brandSlug = typeof body.brand_slug === 'string' ? body.brand_slug.trim().toLowerCase() : ''
  const sourceKey = typeof body.source_key === 'string' ? body.source_key.trim().toLowerCase() : ''
  if (command === 'company_status' && (!brandSlug || brandSlug.length > 120)) return json({ error: 'Selecione uma empresa válida.' }, 400)
  if (command === 'source_lookup' && (!sourceKey || sourceKey.length > 120)) return json({ error: 'Selecione uma fonte válida.' }, 400)

  try {
    const client = await createSupabaseServerClient()
    const auth = await client.auth.getUser()
    if (auth.error || !auth.data.user) return json({ error: 'Sessão não autorizada.' }, 401)
    const generatedAt = new Date().toISOString()
    const today = generatedAt.slice(0, 10)
    const base = { command, generated_at: generatedAt, scope }

    if (command === 'overdue') {
      const count = countOf(await taskCount(client).lt('due_date', today))
      return json({ ...base, sources: ['wh_tasks'], metrics: { overdue_tasks: count },
        summary: [`${count} tarefa(s) vencida(s) e não marcadas como concluídas.`] })
    }

    if (command === 'attention') {
      const results = await Promise.all([
        taskCount(client).lt('due_date', today), taskCount(client).eq('priority', 'High'),
        kpiRiskCount(client), incidentCount(client),
      ])
      const [overdue, high, risk, incidents] = results.map(countOf)
      return json({ ...base, sources: ['wh_tasks', 'wh_kpis', 'xrmg_incident_register'],
        metrics: { overdue_tasks: overdue, high_priority_tasks: high, at_risk_kpis: risk, active_incidents: incidents },
        summary: [
          `${overdue} tarefa(s) vencida(s) e não marcadas como concluídas.`,
          `${high} tarefa(s) de alta prioridade não marcadas como concluídas.`,
          `${risk} registro(s) de KPI com estado de risco na fonte.`,
          `${incidents} incidente(s) com estado ativo registrado.`,
        ] })
    }

    if (command === 'health') {
      const [checksResult, incidentResult] = await Promise.all([
        client.from('xrmg_system_checks')
          .select('id,system_key,check_key,status,checked_at,expires_at,summary,source', { count: 'exact' })
          .order('checked_at', { ascending: false }).order('id', { ascending: true }).limit(healthLimit),
        incidentCount(client),
      ])
      const total = countOf(checksResult)
      const incidents = countOf(incidentResult)
      if (!Array.isArray(checksResult.data) || checksResult.data.length > healthLimit ||
        checksResult.data.length > total || (total > 0 && checksResult.data.length === 0)) throw new Error('Source rows unavailable')
      const now = Date.parse(generatedAt)
      const checks = checksResult.data.map((check: unknown) => {
        if (!isRecord(check) || !['id', 'system_key', 'check_key', 'status']
          .every(key => typeof check[key] === 'string' && String(check[key]).trim())) throw new Error('Malformed source row')
        return { ...check, freshness: freshness(check, now) }
      })
      const current = checks.filter(check => check.freshness === 'current').length
      const stale = checks.filter(check => check.freshness === 'stale').length
      const unknown = checks.filter(check => check.freshness === 'unknown').length
      const partial = total > checks.length
      return json({ ...base, sources: ['xrmg_system_checks', 'xrmg_incident_register'],
        metrics: { current_evidence: current, stale_evidence: stale, unknown_evidence: unknown, active_incidents: incidents },
        coverage: { source: 'xrmg_system_checks', returned: checks.length, total, limit: healthLimit, partial },
        summary: [
          checks.length ? `${checks.length} de ${total} registro(s) de check consultados${partial ? '; cobertura parcial' : ''}.` :
            'Nenhum registro de check disponível para esta sessão; saúde atual desconhecida.',
          `${current} evidência(s) dentro da validade, ${stale} expirada(s) e ${unknown} sem validade verificável, entre os registros consultados.`,
          `${incidents} incidente(s) com estado ativo registrado.`,
          'Validade da evidência não significa sistema saudável; consulte o status e a fonte de cada check.',
        ], details: { checks } })
    }

    if (command === 'company_status') {
      const brandResult = await client.from('wh_brands').select('id,name,slug').eq('slug', brandSlug).maybeSingle()
      if (brandResult.error) throw new Error('Company source unavailable')
      const brand = brandResult.data
      if (!brand) return json({ error: 'Empresa não encontrada ou não acessível para esta sessão.' }, 404)
      if (typeof brand.id !== 'string' || !brand.id || typeof brand.name !== 'string' || !brand.name ||
        brand.slug !== brandSlug) throw new Error('Malformed company row')
      const results = await Promise.all([
        taskCount(client).eq('brand_id', brand.id), taskCount(client).eq('brand_id', brand.id).lt('due_date', today),
        client.from('wh_projects').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id),
        kpiRiskCount(client).eq('brand_id', brand.id),
      ])
      const [open, overdue, projects, risk] = results.map(countOf)
      return json({ ...base, sources: ['wh_brands', 'wh_tasks', 'wh_projects', 'wh_kpis'],
        metrics: { open_tasks: open, overdue_tasks: overdue, projects, at_risk_kpis: risk },
        summary: [brand.name, `${open} tarefa(s) não marcadas como concluídas, incluindo ${overdue} vencida(s).`,
          `${projects} projeto(s).`, `${risk} registro(s) de KPI com estado de risco na fonte.`], details: { brand } })
    }

    const source = sourceRegistry.find(item => item.key.toLowerCase() === sourceKey)
    if (!source) return json({ error: 'Fonte não encontrada no catálogo.' }, 404)
    return json({ ...base, sources: ['lib/source-registry.ts'],
      scope: 'Snapshot documental do catálogo. Esta consulta não verifica conectividade, saúde ou permissões atuais.',
      metrics: { declared_capabilities: source.supportedActions.length },
      summary: [`${source.name}: estado catalogado como ${sourceStateLabel(source.state)} em ${source.snapshotDate}.`,
        `Autoridade: ${source.authority}`, `${source.supportedActions.length} capacidade(s) descrita(s) nesse snapshot.`],
      details: { source } })
  } catch {
    return json({ error: 'Não foi possível confirmar a consulta nas fontes. Tente novamente.' }, 503)
  }
}
