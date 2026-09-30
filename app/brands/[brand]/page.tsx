'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase, type BrandRecord, type FinanceRecord, type KPIRecord, type ProjectRecord, type TaskRecord } from '@/lib/supabase'

interface BrandPageProps { params: { brand: string } }

export default function BrandPage({ params }: BrandPageProps) {
  const [brand,setBrand]=useState<BrandRecord|null>(null)
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [projects,setProjects]=useState<ProjectRecord[]>([])
  const [finance,setFinance]=useState<FinanceRecord[]>([])
  const [kpis,setKpis]=useState<KPIRecord[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    const load=async()=>{
      const b=await supabase.from('wh_brands').select('*').eq('slug',params.brand).single()
      if(b.error||!b.data){setError(b.error?.message||'Empresa não encontrada');setLoading(false);return}
      const current=b.data as BrandRecord
      setBrand(current)
      const [t,p,f,k]=await Promise.all([
        supabase.from('wh_tasks').select('*').eq('brand_id',current.id).order('created_at',{ascending:false}),
        supabase.from('wh_projects').select('*').eq('brand_id',current.id).order('created_at',{ascending:false}),
        supabase.from('wh_finance').select('*').eq('brand_id',current.id).order('created_at',{ascending:false}),
        supabase.from('wh_kpis').select('*').eq('brand_id',current.id).order('created_at',{ascending:false}),
      ])
      const first=t.error||p.error||f.error||k.error
      if(first)setError(first.message)
      else {setTasks((t.data||[]) as TaskRecord[]);setProjects((p.data||[]) as ProjectRecord[]);setFinance((f.data||[]) as FinanceRecord[]);setKpis((k.data||[]) as KPIRecord[])}
      setLoading(false)
    }
    load()
  },[params.brand])

  if(loading)return <div className="p-10"><Card className="p-10 text-center text-slate-500">Carregando empresa…</Card></div>
  if(error||!brand)return <div className="p-10"><Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível abrir esta empresa.</p><p className="text-sm text-slate-500 mt-2">{error}</p><Link href="/brands" className="inline-block mt-4 text-sm font-semibold">Voltar para Empresas</Link></Card></div>

  const openTasks=tasks.filter(t=>t.status!=='Done').length
  const riskKpis=kpis.filter(k=>k.health==='At Risk'||k.health==='Off Track').length

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <Link href="/brands" className="text-sm font-semibold text-slate-500">← Empresas</Link>
    <div className="mt-5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div><p className="text-xs font-bold tracking-[0.18em] text-slate-500">EMPRESA / PRODUTO</p><h1 className="text-4xl font-black mt-1">{brand.name}</h1><p className="text-slate-500 mt-2 max-w-2xl">{brand.description||'Descrição ainda não registrada.'}</p></div>
      <span className="text-xs bg-slate-100 rounded-full px-3 py-1.5 w-fit">{brand.status||'Status não informado'}</span>
    </div>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
      <Metric label="Tarefas abertas" value={String(openTasks)}/>
      <Metric label="Projetos" value={String(projects.length)}/>
      <Metric label="KPIs em risco" value={String(riskKpis)}/>
      <Metric label="Registros financeiros" value={String(finance.length)}/>
    </div>

    <div className="grid xl:grid-cols-2 gap-6 mt-6">
      <Card className="p-5"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Próximas tarefas</h2><Link href="/tasks" className="text-sm font-semibold">Todas →</Link></div>{tasks.filter(t=>t.status!=='Done').slice(0,6).length===0?<p className="text-sm text-slate-500 py-6">Nenhuma tarefa aberta vinculada.</p>:<div className="space-y-3">{tasks.filter(t=>t.status!=='Done').slice(0,6).map(t=><div key={t.id} className="border border-slate-200 rounded-lg p-3"><p className="font-semibold text-sm">{t.title}</p><p className="text-xs text-slate-500 mt-1">{t.status}{t.due_date?` · ${t.due_date}`:''}</p></div>)}</div>}</Card>
      <Card className="p-5"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Projetos</h2><Link href="/projects" className="text-sm font-semibold">Todos →</Link></div>{projects.slice(0,6).length===0?<p className="text-sm text-slate-500 py-6">Nenhum projeto vinculado.</p>:<div className="space-y-3">{projects.slice(0,6).map(p=><div key={p.id} className="border border-slate-200 rounded-lg p-3"><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-slate-500 mt-1">{p.status||'Sem status'} · {p.owner||'Sem responsável'}</p></div>)}</div>}</Card>
    </div>

    <div className="grid xl:grid-cols-2 gap-6 mt-6">
      <Card className="p-5"><h2 className="font-bold text-xl mb-1">Financeiro</h2><p className="text-xs text-amber-700 mb-4">Estes são registros do WorkHub; não representam contabilidade oficial até uma fonte financeira autoritativa ser conectada.</p>{finance.length===0?<p className="text-sm text-slate-500 py-6">Fonte sem registros para esta empresa.</p>:<div className="space-y-2">{finance.slice(0,8).map(r=><div key={r.id} className="flex justify-between border-b border-slate-100 py-2 text-sm"><span>{r.item}</span><span>{r.amount==null?'Valor não informado':`$${Number(r.amount).toLocaleString('en-US')}`}</span></div>)}</div>}</Card>
      <Card className="p-5"><h2 className="font-bold text-xl mb-4">KPIs</h2>{kpis.length===0?<p className="text-sm text-slate-500 py-6">Nenhum KPI registrado para esta empresa.</p>:<div className="space-y-3">{kpis.slice(0,8).map(k=><div key={k.id} className="border border-slate-200 rounded-lg p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-sm">{k.metric}</p><span className="text-xs bg-slate-100 rounded-full px-2 py-1">{k.health}</span></div><p className="text-xs text-slate-500 mt-2">Meta: {k.target??'—'} · Atual: {k.actual??'—'} · {k.period||'Período não informado'}</p></div>)}</div>}</Card>
    </div>
  </div>
}

function Metric({label,value}:{label:string;value:string}){return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className="text-4xl font-black mt-2">{value}</p></Card>}
