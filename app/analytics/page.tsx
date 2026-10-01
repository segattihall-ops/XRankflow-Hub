'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase, type KPIRecord, type ProjectRecord, type TaskRecord, type BrandRecord } from '@/lib/supabase'

type State = 'loading' | 'ready' | 'error'

export default function AnalyticsPage() {
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [projects,setProjects]=useState<ProjectRecord[]>([])
  const [kpis,setKpis]=useState<KPIRecord[]>([])
  const [brands,setBrands]=useState<BrandRecord[]>([])
  const [state,setState]=useState<State>('loading')
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    const load=async()=>{
      const [t,p,k,b]=await Promise.all([
        supabase.from('wh_tasks').select('*'),
        supabase.from('wh_projects').select('*'),
        supabase.from('wh_kpis').select('*'),
        supabase.from('wh_brands').select('*'),
      ])
      const first=t.error||p.error||k.error||b.error
      if(first){setError(first.message);setState('error');return}
      setTasks((t.data||[]) as TaskRecord[])
      setProjects((p.data||[]) as ProjectRecord[])
      setKpis((k.data||[]) as KPIRecord[])
      setBrands((b.data||[]) as BrandRecord[])
      setState('ready')
    }
    void load()
  },[])

  const today=new Date().toISOString().slice(0,10)
  const openTasks=useMemo(()=>tasks.filter(t=>t.status!=='Done'),[tasks])
  const overdue=useMemo(()=>openTasks.filter(t=>t.due_date&&t.due_date<today),[openTasks,today])
  const done=useMemo(()=>tasks.filter(t=>t.status==='Done'),[tasks])
  const blocked=useMemo(()=>openTasks.filter(t=>t.status==='Waiting'||t.status==='Parked'),[openTasks])
  const riskKpis=useMemo(()=>kpis.filter(k=>k.health==='At Risk'||k.health==='Off Track'),[kpis])

  if(state==='loading') return <div className="p-6 lg:p-10"><Card className="p-10 text-center text-slate-500">Carregando analytics…</Card></div>
  if(state==='error') return <div className="p-6 lg:p-10"><Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível carregar as métricas.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card></div>

  const completion=tasks.length?Math.round((done.length/tasks.length)*100):0

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">MÉTRICAS OPERACIONAIS</p>
    <h1 className="text-3xl font-black mt-1">Analytics</h1>
    <p className="text-slate-500 mt-2 mb-8">Métricas derivadas somente dos registros operacionais atualmente conectados ao XRANKFLOW OS.</p>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Metric label="Tarefas abertas" value={openTasks.length}/>
      <Metric label="Tarefas vencidas" value={overdue.length}/>
      <Metric label="Conclusão" value={completion} suffix="%"/>
      <Metric label="KPIs em risco" value={riskKpis.length}/>
    </div>

    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Card className="p-5">
        <h2 className="font-bold text-xl">Execução</h2>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <Box label="Projetos" value={projects.length}/>
          <Box label="Empresas" value={brands.length}/>
          <Box label="Bloqueadas / aguardando" value={blocked.length}/>
          <Box label="Concluídas" value={done.length}/>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-bold text-xl">Qualidade dos dados</h2>
        <div className="space-y-3 mt-4 text-sm">
          <p><span className="font-semibold">Fonte:</span> tabelas operacionais <code>wh_*</code>.</p>
          <p><span className="font-semibold">Atualização:</span> leitura ao abrir esta tela.</p>
          <p><span className="font-semibold">Limite:</span> isto não substitui analytics de produto, finanças ou CRM externos.</p>
        </div>
      </Card>
    </div>
  </div>
}

function Metric({label,value,suffix=''}:{label:string;value:number;suffix?:string}){return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className="text-4xl font-black mt-2">{value}{suffix}</p></Card>}
function Box({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>}
