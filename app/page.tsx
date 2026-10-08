'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock3,
  FolderKanban,
  Gauge,
  Plug,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
} from 'lucide-react'
import { supabase, type BrandRecord, type KPIRecord, type ProjectRecord, type TaskRecord } from '@/lib/supabase'
import { getAutomationMode, XRMG_AUTONOMY_POLICY } from '@/lib/autonomy-policy'

type LoadState = 'loading' | 'ready' | 'error'

type Automation = {
  id: number
  automation_key: string
  name: string
  company_key: string | null
  status: string
  sync_status: string
  source_enabled: boolean | null
  risk_level: string
  human_approval: string | null
  owner_agent: string
}

type Effectiveness = {
  automation_key: string
  run_count: number | string | null
  success_count: number | string | null
  failure_count: number | string | null
  success_rate: number | string | null
  minutes_saved: number | string | null
  manual_actions_removed: number | string | null
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

export default function Home() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [kpis, setKpis] = useState<KPIRecord[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [effectiveness, setEffectiveness] = useState<Effectiveness[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [taskRes, projectRes, brandRes, kpiRes, automationRes, effectivenessRes, runsRes] = await Promise.all([
        supabase.from('wh_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('wh_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('wh_brands').select('*').order('sort', { ascending: true }),
        supabase.from('wh_kpis').select('*').order('created_at', { ascending: false }),
        supabase
          .from('xrmg_automation_registry')
          .select('id,automation_key,name,company_key,status,sync_status,source_enabled,risk_level,human_approval,owner_agent')
          .order('updated_at', { ascending: false }),
        supabase
          .from('xrmg_automation_effectiveness')
          .select('automation_key,run_count,success_count,failure_count,success_rate,minutes_saved,manual_actions_removed'),
        supabase
          .from('xrmg_automation_runs')
          .select('id,automation_key,status,started_at,finished_at,error_message,minutes_saved,manual_actions_removed')
          .order('started_at', { ascending: false })
          .limit(50),
      ])

      const firstError =
        taskRes.error ||
        projectRes.error ||
        brandRes.error ||
        kpiRes.error ||
        automationRes.error ||
        effectivenessRes.error ||
        runsRes.error

      if (firstError) {
        setError(firstError.message)
        setState('error')
        return
      }

      setTasks((taskRes.data || []) as TaskRecord[])
      setProjects((projectRes.data || []) as ProjectRecord[])
      setBrands((brandRes.data || []) as BrandRecord[])
      setKpis((kpiRes.data || []) as KPIRecord[])
      setAutomations((automationRes.data || []) as Automation[])
      setEffectiveness((effectivenessRes.data || []) as Effectiveness[])
      setRuns((runsRes.data || []) as AutomationRun[])
      setState('ready')
    }

    void load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const overdue = useMemo(
    () => tasks.filter(task => task.due_date && task.due_date < today && task.status !== 'Done'),
    [tasks, today],
  )
  const dueToday = useMemo(
    () => tasks.filter(task => task.due_date === today && task.status !== 'Done'),
    [tasks, today],
  )
  const highPriority = useMemo(
    () => tasks.filter(task => task.priority === 'High' && task.status !== 'Done'),
    [tasks],
  )
  const blocked = useMemo(
    () => tasks.filter(task => task.status === 'Parked' || task.status === 'Waiting'),
    [tasks],
  )
  const riskKpis = useMemo(
    () => kpis.filter(kpi => kpi.health === 'At Risk' || kpi.health === 'Off Track'),
    [kpis],
  )

  const automationSummary = useMemo(() => {
    const runCount = effectiveness.reduce((sum, metric) => sum + numberValue(metric.run_count), 0)
    const successCount = effectiveness.reduce((sum, metric) => sum + numberValue(metric.success_count), 0)
    const failureCount = effectiveness.reduce((sum, metric) => sum + numberValue(metric.failure_count), 0)
    const minutesSaved = effectiveness.reduce((sum, metric) => sum + numberValue(metric.minutes_saved), 0)
    const manualActionsRemoved = effectiveness.reduce((sum, metric) => sum + numberValue(metric.manual_actions_removed), 0)

    let auto = 0
    let approval = 0
    let advise = 0
    let blockedMode = 0

    for (const automation of automations) {
      const mode = getAutomationMode({
        status: automation.status,
        syncStatus: automation.sync_status,
        sourceEnabled: automation.source_enabled,
        riskLevel: automation.risk_level,
        humanApproval: automation.human_approval,
      })
      if (mode === 'AUTO') auto += 1
      if (mode === 'APPROVAL') approval += 1
      if (mode === 'ADVISE') advise += 1
      if (mode === 'BLOCKED') blockedMode += 1
    }

    return {
      activeVerified: automations.filter(
        automation =>
          automation.status === 'ACTIVE' &&
          automation.sync_status === 'VERIFIED' &&
          automation.source_enabled !== false,
      ).length,
      drift: automations.filter(hasSourceDrift).length,
      runCount,
      successCount,
      failureCount,
      successRate: runCount > 0 ? (successCount / runCount) * 100 : 0,
      minutesSaved,
      manualActionsRemoved,
      auto,
      approval,
      advise,
      blockedMode,
    }
  }, [automations, effectiveness])

  const registryByKey = useMemo(
    () => new Map(automations.map(automation => [automation.automation_key, automation])),
    [automations],
  )

  const recentRuns = useMemo(() => runs.slice(0, 6), [runs])

  const attention = useMemo(
    () => [
      ...overdue,
      ...highPriority.filter(task => !overdue.some(overdueTask => overdueTask.id === task.id)),
      ...blocked.filter(task => !overdue.some(overdueTask => overdueTask.id === task.id)),
    ].slice(0, 8),
    [blocked, highPriority, overdue],
  )

  const companyCoverage = useMemo(() => {
    const coverage = new Map<string, number>()
    for (const automation of automations) {
      const company = automation.company_key || 'xrmg'
      coverage.set(company, (coverage.get(company) || 0) + 1)
    }
    return Array.from(coverage.entries()).sort((a, b) => b[1] - a[1])
  }, [automations])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#070707] p-6 lg:p-10 text-white">
        <DarkPanel className="mx-auto max-w-4xl p-10 text-center">
          <p className="text-sm text-neutral-400">Carregando XRANKFLOW AUTO Command Center...</p>
        </DarkPanel>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#070707] p-6 lg:p-10 text-white">
        <DarkPanel className="mx-auto max-w-4xl p-8 border-red-400/30">
          <p className="font-bold text-red-300">Nao foi possivel carregar os dados operacionais.</p>
          <p className="mt-2 text-sm text-neutral-400">{error}</p>
          <p className="mt-4 text-sm text-neutral-500">Nenhum valor foi substituido por dado ficticio.</p>
        </DarkPanel>
      </div>
    )
  }

  const executiveIssues =
    attention.length +
    automationSummary.drift +
    automationSummary.failureCount +
    riskKpis.length

  return (
    <div className="min-h-screen bg-[#070707] text-neutral-100">
      <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tracking-[0.18em] text-emerald-400">CEO COMMAND CENTER</span>
              <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                DEFAULT MODE: AUTO
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">XRANKFLOW AUTO</h1>
            <p className="mt-3 max-w-3xl text-sm text-neutral-400 sm:text-base">
              Detectar, analisar, decidir, executar, verificar e reportar. Somente evidencia observada e fontes conectadas contam como resultado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/automations"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              <Workflow size={16} />
              Automation OS
            </Link>
            <Link
              href="/ai"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/20"
            >
              <Sparkles size={16} />
              Ask XRankFlow
            </Link>
          </div>
        </div>

        <DarkPanel className="mb-6 overflow-hidden p-0">
          <div className="grid lg:grid-cols-[1.5fr_1fr]">
            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">AI EXECUTIVE BRIEF</p>
              <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                {executiveIssues === 0
                  ? 'Nenhuma excecao operacional critica nas fontes carregadas.'
                  : String(executiveIssues) + ' sinais exigem atencao ou validacao.'}
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <BriefLine
                  icon={<AlertTriangle size={16} />}
                  label="Trabalho"
                  value={String(attention.length) + ' itens priorizados'}
                  tone={attention.length ? 'warning' : 'normal'}
                />
                <BriefLine
                  icon={<Workflow size={16} />}
                  label="Automation drift"
                  value={String(automationSummary.drift) + ' fontes para revisar'}
                  tone={automationSummary.drift ? 'warning' : 'normal'}
                />
                <BriefLine
                  icon={<XCircle size={16} />}
                  label="Runs com falha"
                  value={formatNumber(automationSummary.failureCount)}
                  tone={automationSummary.failureCount ? 'danger' : 'normal'}
                />
                <BriefLine
                  icon={<Gauge size={16} />}
                  label="KPIs em risco"
                  value={String(riskKpis.length)}
                  tone={riskKpis.length ? 'danger' : 'normal'}
                />
              </div>
            </div>

            <div className="border-t border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">AUTONOMY POLICY</p>
                  <p className="mt-1 text-lg font-semibold">AUTO by default</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-neutral-400">{XRMG_AUTONOMY_POLICY.autoScope}</p>
              <p className="mt-4 text-xs leading-5 text-neutral-500">
                Approval gates remain active for financial, legal/compliance, security/privacy, destructive and irreversible actions.
              </p>
            </div>
          </div>
        </DarkPanel>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
          <Metric label="AUTO" value={automationSummary.auto} accent />
          <Metric label="Approval" value={automationSummary.approval} />
          <Metric label="Ativas verificadas" value={automationSummary.activeVerified} />
          <Metric label="Runs observados" value={automationSummary.runCount} />
          <Metric label="Success rate" value={automationSummary.successRate} suffix="%" />
          <Metric label="Falhas" value={automationSummary.failureCount} tone={automationSummary.failureCount ? 'danger' : 'normal'} />
          <Metric label="Min. economizados" value={automationSummary.minutesSaved} />
          <Metric label="Acoes removidas" value={automationSummary.manualActionsRemoved} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <DarkPanel className="p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">ATTENTION QUEUE</p>
                <h2 className="mt-1 text-xl font-semibold">O que ainda precisa de voce</h2>
              </div>
              <AlertTriangle size={20} className={attention.length ? 'text-amber-300' : 'text-neutral-600'} />
            </div>

            {attention.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 text-sm text-emerald-200">
                Nenhum item critico identificado nas tarefas conectadas.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {attention.map(task => (
                  <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-neutral-100">{task.title}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {task.owner_role || 'Responsavel nao definido'}
                        {task.due_date ? ' · prazo ' + task.due_date : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-neutral-300">
                        {task.status}
                      </span>
                      {task.priority && (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-2.5 py-1 text-[11px] text-amber-300">
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DarkPanel>

          <DarkPanel className="p-5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">TODAY</p>
            <h2 className="mb-4 mt-1 text-xl font-semibold">Execution</h2>
            <div className="space-y-3">
              <Quick href="/tasks" icon={<CheckSquare size={18} />} label="Tarefas" detail={String(tasks.length) + ' registradas'} />
              <Quick href="/projects" icon={<FolderKanban size={18} />} label="Projetos" detail={String(projects.length) + ' registrados'} />
              <Quick href="/brands" icon={<Building2 size={18} />} label="Empresas" detail={String(brands.length) + ' na fonte WorkHub'} />
              <Quick href="/integrations" icon={<Plug size={18} />} label="Integrações" detail="Fontes e conexoes" />
            </div>
          </DarkPanel>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <DarkPanel className="p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">AGENT ACTIVITY</p>
                <h2 className="mt-1 text-xl font-semibold">Execucoes recentes</h2>
              </div>
              <Link href="/automations" className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white">
                Ver tudo <ArrowRight size={14} />
              </Link>
            </div>

            {recentRuns.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.08] p-5 text-sm text-neutral-500">Nenhum run observado.</p>
            ) : (
              <div className="space-y-2">
                {recentRuns.map(run => {
                  const automation = registryByKey.get(run.automation_key)
                  const success = run.status === 'SUCCESS'
                  return (
                    <div key={run.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                      <div className={success ? 'mt-0.5 text-emerald-300' : 'mt-0.5 text-amber-300'}>
                        {success ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{automation?.name || run.automation_key}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {run.status} · {new Date(run.started_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-neutral-400">
                        {automation?.owner_agent || 'Agent'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </DarkPanel>

          <DarkPanel className="p-5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">AUTOMATION COVERAGE</p>
            <h2 className="mt-1 text-xl font-semibold">Empresas cobertas pelo OS</h2>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Contagem de automacoes registradas por company_key. Isto nao representa status comercial ou financeiro.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {companyCoverage.map(([company, count]) => (
                <div key={company} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <p className="text-sm font-semibold capitalize">{company}</p>
                  <p className="mt-1 text-xs text-neutral-500">{count} automacoes registradas</p>
                </div>
              ))}
            </div>
          </DarkPanel>
        </div>

        <DarkPanel className="mt-6 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-neutral-500">CONTROLLED AUTONOMY</p>
              <h2 className="mt-1 text-xl font-semibold">AUTO nao significa sem controle</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{XRMG_AUTONOMY_POLICY.verificationRule}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[520px]">
              {XRMG_AUTONOMY_POLICY.approvalGates.map(gate => (
                <div key={gate} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-xs text-neutral-400">
                  {gate}
                </div>
              ))}
            </div>
          </div>
        </DarkPanel>
      </div>
    </div>
  )
}

function DarkPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        'rounded-[22px] border border-white/[0.09] bg-[linear-gradient(155deg,rgba(255,255,255,0.065),rgba(255,255,255,0.018)_52%),rgba(12,12,12,0.94)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl ' +
        className
      }
    >
      {children}
    </div>
  )
}

function Metric({
  label,
  value,
  suffix = '',
  tone = 'normal',
  accent = false,
}: {
  label: string
  value: number
  suffix?: string
  tone?: 'normal' | 'danger'
  accent?: boolean
}) {
  const valueClass = tone === 'danger' ? 'text-red-300' : accent ? 'text-emerald-300' : 'text-white'
  return (
    <DarkPanel className={accent ? 'p-4 ring-1 ring-inset ring-emerald-400/20' : 'p-4'}>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-neutral-500">{label}</p>
      <p className={'mt-2 text-2xl font-semibold tracking-[-0.03em] ' + valueClass}>
        {formatNumber(value)}{suffix}
      </p>
    </DarkPanel>
  )
}

function BriefLine({
  icon,
  label,
  value,
  tone = 'normal',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: 'normal' | 'warning' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-400/20 bg-red-400/[0.06] text-red-200'
      : tone === 'warning'
        ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200'
        : 'border-white/[0.08] bg-white/[0.025] text-neutral-300'

  return (
    <div className={'rounded-2xl border p-3 ' + toneClass}>
      <div className="flex items-center gap-2 text-xs">
        {icon}
        <span className="text-neutral-500">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  )
}

function Quick({
  href,
  icon,
  label,
  detail,
}: {
  href: string
  icon: ReactNode
  label: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 transition hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{detail}</p>
      </div>
    </Link>
  )
}

function hasSourceDrift(automation: Automation) {
  if (automation.sync_status !== 'VERIFIED') return true
  if (automation.status === 'ACTIVE' && automation.source_enabled === false) return true
  if (automation.status === 'PAUSED' && automation.source_enabled === true) return true
  if (automation.source_enabled === null) return true
  return false
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}
