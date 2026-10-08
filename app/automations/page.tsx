'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { supabase } from '@/lib/supabase'
import { getAutomationMode } from '@/lib/autonomy-policy'

type Automation = {
  id: number
  automation_key: string
  name: string
  company_key: string | null
  trigger_type: string
  trigger_description: string | null
  human_approval: string | null
  logging_location: string | null
  recovery_procedure: string | null
  status: string
  owner_agent: string
  last_run_at: string | null
  last_result: string | null
  updated_at: string
  source_system: string
  source_external_id: string | null
  source_enabled: boolean | null
  schedule_ical: string | null
  last_synced_at: string | null
  sync_status: string
  priority: string
  automation_level: number
  frequency: string | null
  risk_level: string
}

type Effectiveness = {
  automation_key: string
  run_count: number | string | null
  success_count: number | string | null
  failure_count: number | string | null
  success_rate: number | string | null
  minutes_saved: number | string | null
  manual_actions_removed: number | string | null
  last_observed_run_at: string | null
}

type AutomationRun = {
  id: string
  automation_key: string
  status: string
  started_at: string
  finished_at: string | null
  error_message: string | null
  minutes_saved: number | string
  manual_actions_removed: number
}

export default function AutomationsPage() {
  const [rows, setRows] = useState<Automation[]>([])
  const [effectiveness, setEffectiveness] = useState<Effectiveness[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState('All')

  async function load() {
    setLoading(true)
    setError(null)

    const [registryRes, effectivenessRes, runsRes] = await Promise.all([
      supabase
        .from('xrmg_automation_registry')
        .select('id,automation_key,name,company_key,trigger_type,trigger_description,human_approval,logging_location,recovery_procedure,status,owner_agent,last_run_at,last_result,updated_at,source_system,source_external_id,source_enabled,schedule_ical,last_synced_at,sync_status,priority,automation_level,frequency,risk_level')
        .order('priority', { ascending: true })
        .order('updated_at', { ascending: false }),
      supabase
        .from('xrmg_automation_effectiveness')
        .select('automation_key,run_count,success_count,failure_count,success_rate,minutes_saved,manual_actions_removed,last_observed_run_at'),
      supabase
        .from('xrmg_automation_runs')
        .select('id,automation_key,status,started_at,finished_at,error_message,minutes_saved,manual_actions_removed')
        .order('started_at', { ascending: false })
        .limit(100),
    ])

    const firstError = registryRes.error || effectivenessRes.error || runsRes.error

    if (firstError) {
      setError(firstError.message)
    } else {
      setRows((registryRes.data || []) as Automation[])
      setEffectiveness((effectivenessRes.data || []) as Effectiveness[])
      setRuns((runsRes.data || []) as AutomationRun[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const companies = useMemo(
    () => Array.from(new Set(rows.map(row => row.company_key).filter((value): value is string => Boolean(value)))).sort(),
    [rows],
  )

  const filtered = useMemo(
    () => company === 'All' ? rows : rows.filter(row => row.company_key === company),
    [rows, company],
  )

  const metricsByKey = useMemo(
    () => new Map(effectiveness.map(metric => [metric.automation_key, metric])),
    [effectiveness],
  )

  const latestRunByKey = useMemo(() => {
    const map = new Map<string, AutomationRun>()
    for (const run of runs) {
      if (!map.has(run.automation_key)) map.set(run.automation_key, run)
    }
    return map
  }, [runs])

  const summary = useMemo(() => {
    const keys = new Set(filtered.map(row => row.automation_key))
    const scopedMetrics = effectiveness.filter(metric => keys.has(metric.automation_key))

    return {
      activeVerified: filtered.filter(row => row.status === 'ACTIVE' && row.sync_status === 'VERIFIED' && row.source_enabled !== false).length,
      paused: filtered.filter(row => row.status === 'PAUSED').length,
      needsReview: filtered.filter(hasSourceDrift).length,
      observedRuns: scopedMetrics.reduce((sum, metric) => sum + numberValue(metric.run_count), 0),
      failedRuns: scopedMetrics.reduce((sum, metric) => sum + numberValue(metric.failure_count), 0),
      minutesSaved: scopedMetrics.reduce((sum, metric) => sum + numberValue(metric.minutes_saved), 0),
      manualActionsRemoved: scopedMetrics.reduce((sum, metric) => sum + numberValue(metric.manual_actions_removed), 0),
      autoMode: filtered.filter(row => getAutomationMode({
        status: row.status,
        syncStatus: row.sync_status,
        sourceEnabled: row.source_enabled,
        riskLevel: row.risk_level,
        humanApproval: row.human_approval,
      }) === 'AUTO').length,
      approvalMode: filtered.filter(row => getAutomationMode({
        status: row.status,
        syncStatus: row.sync_status,
        sourceEnabled: row.source_enabled,
        riskLevel: row.risk_level,
        humanApproval: row.human_approval,
      }) === 'APPROVAL').length,
    }
  }, [filtered, effectiveness])

  const driftRows = useMemo(() => filtered.filter(hasSourceDrift), [filtered])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
        <OperationalState
          kind="loading"
          title="Carregando Automation OS"
          description="Lendo catálogo, sincronização de fonte e evidência de execução."
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
        <OperationalState
          kind="error"
          title="Automation OS indisponível"
          description={error}
          source="xrmg_automation_registry + xrmg_automation_runs"
          onRetry={() => void load()}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-slate-500">ZERO-MANUAL-WORK CONTROL PLANE</p>
          <h1 className="text-3xl font-black mt-1">Automation OS</h1>
          <p className="text-slate-500 mt-2">
            AUTO é o padrão para trabalho reversível e de baixo risco. Estado da fonte, evidência de runs, falhas e economia medida continuam obrigatórios.
          </p>
        </div>
        <select
          value={company}
          onChange={event => setCompany(event.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
        >
          <option value="All">Todas as empresas</option>
          {companies.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <OperationalState
          kind="empty"
          title="Nenhuma automação registrada"
          description="O catálogo não retornou automações para esta sessão."
          source="xrmg_automation_registry"
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Metric label="AUTO" value={summary.autoMode} />
            <Metric label="Approval" value={summary.approvalMode} />
            <Metric label="Ativas verificadas" value={summary.activeVerified} />
            <Metric label="Pausadas" value={summary.paused} />
            <Metric label="Precisam revisão" value={summary.needsReview} tone={summary.needsReview ? 'warning' : 'normal'} />
            <Metric label="Runs observados" value={summary.observedRuns} />
            <Metric label="Falhas verificadas" value={summary.failedRuns} tone={summary.failedRuns ? 'danger' : 'normal'} />
            <Metric label="Minutos economizados" value={summary.minutesSaved} />
            <Metric label="Ações manuais removidas" value={summary.manualActionsRemoved} />
            <Metric label="Automações no filtro" value={filtered.length} />
          </div>

          <Card className="p-5 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-500">SOURCE-OF-TRUTH CHECK</p>
                <h2 className="font-bold text-xl mt-1">Drift de automações</h2>
              </div>
              <span className={`text-xs rounded-full px-2.5 py-1 h-fit ${driftRows.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {driftRows.length ? `${driftRows.length} para revisar` : 'Registry alinhado'}
              </span>
            </div>
            {driftRows.length === 0 ? (
              <p className="text-sm text-slate-600 mt-4">
                Nenhuma divergência conhecida entre status do registry e estado sincronizado da fonte neste filtro.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {driftRows.map(row => (
                  <div key={row.automation_key} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="font-semibold text-sm">{row.name}</p>
                    <p className="text-xs text-amber-800 mt-1">{driftReason(row)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {filtered.map(automation => {
              const metric = metricsByKey.get(automation.automation_key)
              const latestRun = latestRunByKey.get(automation.automation_key)
              const runCount = numberValue(metric?.run_count)
              const successCount = numberValue(metric?.success_count)
              const failureCount = numberValue(metric?.failure_count)
              const measuredMinutes = numberValue(metric?.minutes_saved)
              const measuredActions = numberValue(metric?.manual_actions_removed)
              const autonomyMode = getAutomationMode({
                status: automation.status,
                syncStatus: automation.sync_status,
                sourceEnabled: automation.source_enabled,
                riskLevel: automation.risk_level,
                humanApproval: automation.human_approval,
              })

              return (
                <Card key={automation.id} className="p-5">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-lg">{automation.name}</p>
                        <StatusBadge status={automation.status} />
                        <ModeBadge mode={autonomyMode} />
                        <SyncBadge status={automation.sync_status} />
                        <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{automation.priority}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {automation.company_key || 'Holding'} · L{automation.automation_level} · {automation.frequency || automation.trigger_type} · risco {automation.risk_level}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-2 break-all">{automation.automation_key}</p>
                    </div>
                    <div className="text-xs text-slate-500 xl:text-right">
                      <p>Fonte: <b>{automation.source_system}</b></p>
                      <p className="mt-1">Última sync: {automation.last_synced_at ? formatFreshness(automation.last_synced_at) : 'nunca verificada'}</p>
                      {automation.source_external_id && <p className="mt-1 break-all">ID: {automation.source_external_id}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5 text-sm">
                    <Info label="Responsável" value={automation.owner_agent || 'Não definido'} />
                    <Info label="Aprovação humana" value={automation.human_approval || 'Não declarada'} />
                    <Info label="Último resultado" value={automation.last_result || 'Sem evidência'} />
                    <Info label="Último run da fonte" value={automation.last_run_at ? new Date(automation.last_run_at).toLocaleString('pt-BR') : 'Sem run observado'} />
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 text-sm">
                    <Info label="Runs registrados" value={String(runCount)} />
                    <Info label="Sucessos verificados" value={`${successCount} / ${runCount}`} />
                    <Info label="Falhas verificadas" value={String(failureCount)} />
                    <Info label="Último run no OS" value={latestRun ? `${latestRun.status} · ${new Date(latestRun.started_at).toLocaleString('pt-BR')}` : 'Nenhum'} />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4 mt-4">
                    <Info label="Logging" value={automation.logging_location || 'Local de log não declarado'} />
                    <Info label="Recuperação" value={automation.recovery_procedure || 'Procedimento de recuperação não declarado'} />
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
                    {measuredMinutes > 0 || measuredActions > 0
                      ? `Economia medida nos runs registrados: ${measuredMinutes} minutos e ${measuredActions} ações manuais removidas.`
                      : 'Ainda não existe evidência suficiente para contabilizar tempo economizado ou ações manuais removidas. O OS mantém esses valores em zero em vez de estimá-los.'}
                  </div>

                  {latestRun?.error_message && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                      Último erro: {latestRun.error_message}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: number
  tone?: 'normal' | 'warning' | 'danger'
}) {
  const valueClass = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-950'
  return (
    <Card className="p-5">
      <p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p>
      <p className={`text-3xl font-black mt-2 ${valueClass}`}>{formatNumber(value)}</p>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'FAILED'
      ? 'bg-red-50 text-red-700'
      : status === 'PAUSED'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-amber-50 text-amber-700'

  return <span className={`text-xs rounded-full px-2.5 py-1 ${tone}`}>{status}</span>
}

function ModeBadge({ mode }: { mode: 'AUTO' | 'APPROVAL' | 'ADVISE' | 'BLOCKED' }) {
  const tone = mode === 'AUTO'
    ? 'bg-emerald-50 text-emerald-700'
    : mode === 'APPROVAL'
      ? 'bg-amber-50 text-amber-700'
      : mode === 'BLOCKED'
        ? 'bg-red-50 text-red-700'
        : 'bg-blue-50 text-blue-700'

  return <span className={`text-xs rounded-full px-2.5 py-1 font-semibold ${tone}`}>{mode}</span>
}

function SyncBadge({ status }: { status: string }) {
  const tone = status === 'VERIFIED'
    ? 'bg-blue-50 text-blue-700'
    : status === 'ERROR'
      ? 'bg-red-50 text-red-700'
      : 'bg-amber-50 text-amber-700'

  return <span className={`text-xs rounded-full px-2.5 py-1 ${tone}`}>{status}</span>
}

function hasSourceDrift(row: Automation) {
  if (row.sync_status !== 'VERIFIED') return true
  if (row.status === 'ACTIVE' && row.source_enabled === false) return true
  if (row.status === 'PAUSED' && row.source_enabled === true) return true
  if (row.source_system !== 'manual' && row.source_enabled === null) return true
  return false
}

function driftReason(row: Automation) {
  if (row.sync_status !== 'VERIFIED') return `Fonte não verificada: ${row.sync_status}.`
  if (row.status === 'ACTIVE' && row.source_enabled === false) return 'Registry marca ACTIVE, mas a fonte está desabilitada.'
  if (row.status === 'PAUSED' && row.source_enabled === true) return 'Registry marca PAUSED, mas a fonte está habilitada.'
  if (row.source_enabled === null) return 'A fonte ainda não declarou enabled/disabled.'
  return 'Revisão necessária.'
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
}

function formatFreshness(value: string) {
  const delta = Date.now() - new Date(value).getTime()
  if (delta < 0) return 'timestamp futuro'
  const hours = Math.floor(delta / (60 * 60 * 1000))
  if (hours < 1) return 'há menos de 1h'
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}
