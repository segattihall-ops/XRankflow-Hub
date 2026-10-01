'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase, type KPIRecord, type ProjectRecord, type TaskRecord } from '@/lib/supabase'

export default function ReportsPage(){
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [projects,setProjects]=useState<ProjectRecord[]>([])
  const [kpis,setKpis]=useState<KPIRecord[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    Promise.all([
      supabase.from('wh_tasks').select('*'),
      supabase.from('wh_projects').select('*'),
      supabase.from('wh_kpis').select('*'),
    ]).then(([t,p,k])=>{
      const first=t.error||p.error||k.error
      if(first)setError(first.message)
      else {setTasks((t.data||[]) as TaskRecord[]);setProjects((p.data||[]) as ProjectRecord[]);setKpis((k.data||[]) as KPIRecord[])}
      setLoading(false)
    })
  },[])

  const today=new Date().toISOString().slice(0,10)
  const overdue=useMemo(()=>tasks.filter(t=>t.status!=='Done'&&t.due_date&&t.due_date<today),[tasks,today])
  const high=useMemo(()=>tasks.filter(t=>t.status!=='Done'&&t.priority==='High'),[tasks])
  const risk=useMemo(()=>kpis.filter(k=>k.health==='At Risk'||k.health==='Off Track'),[kpis])

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">RELATÓRIO EXECUTIVO</p>
    <h1 className="text-3xl font-black mt-1">Relatórios</h1>
    <p className="text-slate-500 mt-2 mb-8">Resumo operacional gerado a partir das fontes conectadas neste momento.</p>

    {loading&&<Card className="p-8 text-center text-slate-500">Gerando relatório…</Card>}
    {error&&<Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível gerar o relatório.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
    {!loading&&!error&&<>
      <Card className="p-6">
        <p className="text-xs text-slate-400">Gerado em {new Date().toLocaleString('pt-BR')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <Stat label="Projetos" value={projects.length}/>
          <Stat label="Tarefas vencidas" value={overdue.length}/>
          <Stat label="Alta prioridade" value={high.length}/>
          <Stat label="KPIs em risco" value={risk.length}/>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Section title="Vencidas" rows={overdue.map(x=>x.title)}/>
        <Section title="Alta prioridade" rows={high.map(x=>x.title)}/>
        <Section title="KPIs em risco" rows={risk.map(x=>x.metric)}/>
      </div>

      <Card className="p-5 mt-6">
        <p className="font-bold">Escopo do relatório</p>
        <p className="text-sm text-slate-500 mt-2">Inclui apenas Projects, Tasks e KPIs do WorkHub atual. Receita, CRM, email, calendários externos e analytics de produto não são inferidos quando a fonte oficial não está conectada.</p>
      </Card>
    </>}
  </div>
}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-xl bg-slate-50 border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-3xl font-black mt-1">{value}</p></div>}
function Section({title,rows}:{title:string;rows:string[]}){return <Card className="p-5"><h2 className="font-bold">{title}</h2>{rows.length===0?<p className="text-sm text-slate-500 mt-4">Nenhum item.</p>:<ul className="mt-4 space-y-2">{rows.slice(0,8).map((r,i)=><li key={i} className="text-sm border-b border-slate-100 pb-2">{r}</li>)}</ul>}</Card>}
