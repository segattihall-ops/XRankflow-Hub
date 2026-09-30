'use client'
import { useEffect,useMemo,useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase,type TaskRecord } from '@/lib/supabase'

export default function Page(){
 const [tasks,setTasks]=useState<TaskRecord[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null)
 useEffect(()=>{supabase.from('wh_tasks').select('*').not('due_date','is',null).order('due_date',{ascending:true}).then(({data,error})=>{if(error)setError(error.message);else setTasks((data||[]) as TaskRecord[]);setLoading(false)})},[])
 const today=new Date().toISOString().slice(0,10)
 const overdue=useMemo(()=>tasks.filter(t=>t.due_date&&t.due_date<today&&t.status!=='Done'),[tasks,today])
 const todayRows=useMemo(()=>tasks.filter(t=>t.due_date===today&&t.status!=='Done'),[tasks,today])
 const upcoming=useMemo(()=>tasks.filter(t=>t.due_date&&t.due_date>today&&t.status!=='Done').slice(0,30),[tasks,today])
 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><p className="text-xs font-bold tracking-[0.18em] text-slate-500">AGENDA OPERACIONAL</p><h1 className="text-3xl font-black mt-1">Calendário</h1><p className="text-slate-500 mt-2 mb-8">Primeira camada: prazos reais das tarefas do XRANKFLOW OS. Reuniões externas serão adicionadas quando o calendário oficial for conectado.</p>
 {loading&&<Card className="p-8 text-center text-slate-500">Carregando agenda…</Card>}{error&&<Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível carregar a agenda.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
 {!loading&&!error&&<div className="grid lg:grid-cols-3 gap-5"><Group title="Atrasado" rows={overdue}/><Group title="Hoje" rows={todayRows}/><Group title="Próximos" rows={upcoming}/></div>}
 </div>
}
function Group({title,rows}:{title:string;rows:TaskRecord[]}){return <Card className="p-5"><div className="flex justify-between mb-4"><h2 className="font-bold">{title}</h2><span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{rows.length}</span></div>{rows.length===0?<p className="text-sm text-slate-500 py-6 text-center">Nada nesta seção.</p>:<div className="space-y-3">{rows.map(r=><div key={r.id} className="border border-slate-200 rounded-lg p-3"><p className="font-semibold text-sm">{r.title}</p><p className="text-xs text-slate-500 mt-1">{r.due_date} · {r.status}</p></div>)}</div>}</Card>}
