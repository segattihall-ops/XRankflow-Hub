'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase, type ProjectRecord, type TaskRecord } from '@/lib/supabase'

type MilestoneRow = {
  id: number
  company_key: string | null
  milestone: string
  gate_name: string
  status: string
  owner_agent: string
  due_at: string | null
}

type CalendarItem = {
  key: string
  sourceId: string
  source: 'Tarefa' | 'Milestone'
  title: string
  date: string
  status: string
  context: string
}

export default function CalendarPage() {
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [projects,setProjects]=useState<ProjectRecord[]>([])
  const [milestones,setMilestones]=useState<MilestoneRow[]>([])
  const [milestoneWarning,setMilestoneWarning]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    const load=async()=>{
      const [taskRes,projectRes,milestoneRes]=await Promise.all([
        supabase.from('wh_tasks').select('*').not('due_date','is',null).order('due_date',{ascending:true}),
        supabase.from('wh_projects').select('*'),
        supabase.from('xrmg_milestone_gates').select('id,company_key,milestone,gate_name,status,owner_agent,due_at').not('due_at','is',null).order('due_at',{ascending:true}),
      ])

      const primaryError=taskRes.error||projectRes.error
      if(primaryError){
        setError(primaryError.message)
      } else {
        setTasks((taskRes.data||[]) as TaskRecord[])
        setProjects((projectRes.data||[]) as ProjectRecord[])
      }

      if(milestoneRes.error){
        setMilestoneWarning('Milestones internos não estão visíveis para esta sessão; a agenda continua usando prazos de tarefas.')
      } else {
        setMilestones((milestoneRes.data||[]) as MilestoneRow[])
      }

      setLoading(false)
    }

    void load()
  },[])

  const projectById=useMemo(()=>new Map(projects.map(p=>[p.id,p.name])),[projects])

  const items=useMemo<CalendarItem[]>(()=>{
    const taskItems=tasks
      .filter(t=>t.due_date&&t.status!=='Done')
      .map(t=>({
        key:`task-${t.id}`,
        sourceId:`wh_tasks:${t.id}`,
        source:'Tarefa' as const,
        title:t.title,
        date:t.due_date as string,
        status:t.status,
        context:t.project_id ? projectById.get(t.project_id)||'Projeto vinculado' : 'Sem projeto',
      }))

    const milestoneItems=milestones
      .filter(m=>m.due_at&&m.status!=='DONE'&&m.status!=='VERIFIED')
      .map(m=>({
        key:`milestone-${m.id}`,
        sourceId:`xrmg_milestone_gates:${m.id}`,
        source:'Milestone' as const,
        title:`${m.milestone} — ${m.gate_name}`,
        date:(m.due_at as string).slice(0,10),
        status:m.status,
        context:[m.company_key,m.owner_agent].filter(Boolean).join(' · '),
      }))

    return [...taskItems,...milestoneItems].sort((a,b)=>a.date.localeCompare(b.date))
  },[tasks,milestones,projectById])

  const today=new Date().toISOString().slice(0,10)
  const overdue=useMemo(()=>items.filter(i=>i.date<today),[items,today])
  const todayRows=useMemo(()=>items.filter(i=>i.date===today),[items,today])
  const upcoming=useMemo(()=>items.filter(i=>i.date>today).slice(0,40),[items,today])

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">AGENDA OPERACIONAL</p>
    <h1 className="text-3xl font-black mt-1">Calendário</h1>
    <p className="text-slate-500 mt-2 mb-8">
      Prazos de tarefas e milestones internos normalizados em uma única agenda. Reuniões externas permanecem pendentes até o calendário oficial ser conectado.
    </p>

    {loading&&<Card className="p-8 text-center text-slate-500">Carregando agenda…</Card>}
    {error&&<Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível carregar a agenda operacional.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
    {milestoneWarning&&<Card className="p-4 border-amber-200 bg-amber-50 mb-6"><p className="text-sm text-amber-800">{milestoneWarning}</p></Card>}

    {!loading&&!error&&<>
      <div className="grid lg:grid-cols-3 gap-5">
        <Group title="Atrasado" rows={overdue}/>
        <Group title="Hoje" rows={todayRows}/>
        <Group title="Próximos" rows={upcoming}/>
      </div>

      <Card className="p-5 mt-6 bg-slate-50">
        <p className="font-bold">Cobertura da agenda</p>
        <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
          <Coverage label="Tarefas com prazo" value={tasks.length} state="Ativo"/>
          <Coverage label="Milestones com prazo" value={milestones.length} state={milestoneWarning?'Parcial':'Ativo'}/>
          <Coverage label="Reuniões externas" value={null} state="Não conectado"/>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Cada item preserva o ID da fonte para evitar duplicação futura quando conectores externos forem adicionados.
        </p>
      </Card>
    </>}
  </div>
}

function Group({title,rows}:{title:string;rows:CalendarItem[]}) {
  return <Card className="p-5">
    <div className="flex justify-between mb-4">
      <h2 className="font-bold">{title}</h2>
      <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{rows.length}</span>
    </div>
    {rows.length===0
      ? <p className="text-sm text-slate-500 py-6 text-center">Nada nesta seção.</p>
      : <div className="space-y-3">{rows.map(r=><div key={r.key} className="border border-slate-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-sm">{r.title}</p>
            <span className="text-[10px] bg-slate-100 rounded-full px-2 py-1">{r.source}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{r.date} · {r.status}</p>
          <p className="text-xs text-slate-400 mt-1">{r.context}</p>
          <p className="text-[10px] text-slate-300 mt-2 break-all">{r.sourceId}</p>
        </div>)}</div>}
  </Card>
}

function Coverage({label,value,state}:{label:string;value:number|null;state:string}) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="font-bold mt-1">{value===null?'—':value}</p>
    <p className="text-xs text-slate-400 mt-1">{state}</p>
  </div>
}
