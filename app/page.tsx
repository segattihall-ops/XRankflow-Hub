'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, Building2, CheckSquare, FolderKanban, Plug, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { supabase, type BrandRecord, type KPIRecord, type ProjectRecord, type TaskRecord } from '@/lib/supabase'

type LoadState = 'loading' | 'ready' | 'error'

export default function Home() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [kpis, setKpis] = useState<KPIRecord[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [taskRes, projectRes, brandRes, kpiRes] = await Promise.all([
        supabase.from('wh_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('wh_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('wh_brands').select('*').order('sort', { ascending: true }),
        supabase.from('wh_kpis').select('*').order('created_at', { ascending: false }),
      ])
      const firstError = taskRes.error || projectRes.error || brandRes.error || kpiRes.error
      if (firstError) {
        setError(firstError.message)
        setState('error')
        return
      }
      setTasks((taskRes.data || []) as TaskRecord[])
      setProjects((projectRes.data || []) as ProjectRecord[])
      setBrands((brandRes.data || []) as BrandRecord[])
      setKpis((kpiRes.data || []) as KPIRecord[])
      setState('ready')
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const overdue = useMemo(() => tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done'), [tasks, today])
  const dueToday = useMemo(() => tasks.filter(t => t.due_date === today && t.status !== 'Done'), [tasks, today])
  const highPriority = useMemo(() => tasks.filter(t => t.priority === 'High' && t.status !== 'Done'), [tasks])
  const blocked = useMemo(() => tasks.filter(t => t.status === 'Parked' || t.status === 'Waiting'), [tasks])
  const riskKpis = useMemo(() => kpis.filter(k => k.health === 'At Risk' || k.health === 'Off Track'), [kpis])

  if (state === 'loading') {
    return <div className="p-6 lg:p-10"><Card className="p-10 text-center text-slate-500">Carregando Command Center…</Card></div>
  }

  if (state === 'error') {
    return (
      <div className="p-6 lg:p-10 max-w-5xl">
        <Card className="p-8 border-red-200">
          <p className="font-bold text-red-700">Não foi possível carregar os dados operacionais.</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <p className="text-sm text-slate-600 mt-4">Nenhum valor foi substituído por dados fictícios.</p>
        </Card>
      </div>
    )
  }

  const attention = [...overdue, ...highPriority.filter(t => !overdue.some(o => o.id === t.id)), ...blocked.filter(t => !overdue.some(o => o.id === t.id))].slice(0, 8)

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-slate-500">CEO COMMAND CENTER</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mt-1">O que precisa da sua atenção</h1>
          <p className="text-slate-500 mt-2">Somente dados atuais disponíveis nas fontes conectadas.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/ai" className="px-4 py-2 rounded-lg bg-slate-950 text-white text-sm font-semibold flex items-center gap-2"><Sparkles size={16}/>Perguntar à IA</Link>
          <Link href="/integrations" className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold flex items-center gap-2"><Plug size={16}/>Integrações</Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Metric label="Vencidas" value={overdue.length} tone={overdue.length ? 'danger' : 'normal'} />
        <Metric label="Para hoje" value={dueToday.length} />
        <Metric label="Alta prioridade" value={highPriority.length} tone={highPriority.length ? 'warning' : 'normal'} />
        <Metric label="KPIs em risco" value={riskKpis.length} tone={riskKpis.length ? 'danger' : 'normal'} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-xs font-bold tracking-wider text-slate-500">ATENÇÃO</p><h2 className="font-bold text-xl">Itens que exigem ação</h2></div>
            <AlertTriangle size={20} className="text-amber-500"/>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Nenhum item crítico identificado nas tarefas conectadas.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {attention.map(task => (
                <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-slate-500">{task.owner_role || 'Responsável não definido'}{task.due_date ? ` · prazo ${task.due_date}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-slate-100 rounded px-2 py-1">{task.status}</span>
                    {task.priority && <span className="text-xs bg-amber-50 text-amber-700 rounded px-2 py-1">{task.priority}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold tracking-wider text-slate-500">HOJE</p>
          <h2 className="font-bold text-xl mb-4">Execução</h2>
          <div className="space-y-3">
            <Quick href="/tasks" icon={<CheckSquare size={18}/>} label="Tarefas" detail={`${tasks.length} registradas`} />
            <Quick href="/projects" icon={<FolderKanban size={18}/>} label="Projetos" detail={`${projects.length} registrados`} />
            <Quick href="/brands" icon={<Building2 size={18}/>} label="Empresas" detail={`${brands.length} conectadas ao Hub`} />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-5">
          <div className="flex items-end justify-between mb-4">
            <div><p className="text-xs font-bold tracking-wider text-slate-500">PORTFÓLIO</p><h2 className="font-bold text-xl">Empresas e produtos</h2></div>
            <Link href="/brands" className="text-sm font-semibold flex items-center gap-1">Ver todos <ArrowRight size={15}/></Link>
          </div>
          {brands.length === 0 ? <p className="text-sm text-slate-500">Nenhuma empresa cadastrada na fonte atual.</p> :
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {brands.slice(0,8).map(b => <Link key={b.id} href={`/brands/${b.slug}`} className="border border-slate-200 rounded-xl p-4 hover:border-slate-400"><p className="font-bold">{b.name}</p><p className="text-sm text-slate-500 mt-1">{b.status || 'Status não informado'}</p></Link>)}
            </div>}
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value, tone='normal' }: { label:string; value:number; tone?:'normal'|'warning'|'danger' }) {
  const cls = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-950'
  return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className={`text-4xl font-black mt-2 ${cls}`}>{value}</p></Card>
}
function Quick({href,icon,label,detail}:{href:string;icon:ReactNode;label:string;detail:string}) {
  return <Link href={href} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-400"><div>{icon}</div><div><p className="font-semibold text-sm">{label}</p><p className="text-xs text-slate-500">{detail}</p></div></Link>
}
