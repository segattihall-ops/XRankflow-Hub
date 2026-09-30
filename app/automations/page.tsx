'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

type Automation={id:number;name:string;company_key:string;trigger_description:string|null;status:string|null;owner_agent:string|null;last_run_at:string|null;last_result:string|null}

export default function Page(){
 const [rows,setRows]=useState<Automation[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null)
 useEffect(()=>{supabase.from('xrmg_automation_registry').select('id,name,company_key,trigger_description,status,owner_agent,last_run_at,last_result').order('updated_at',{ascending:false}).then(({data,error})=>{if(error)setError(error.message);else setRows((data||[]) as Automation[]);setLoading(false)})},[])
 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">OPERATIONS</p><h1 className="text-3xl font-black mt-1">Automation Center</h1>
  <p className="text-slate-500 mt-2 mb-8">Catálogo operacional, última execução, resultado e responsabilidade.</p>
  {loading&&<Card className="p-8 text-center text-slate-500">Carregando automações…</Card>}
  {error&&<Card className="p-8 border-amber-200"><p className="font-bold text-amber-700">O registro existe, mas esta sessão ainda não possui leitura habilitada.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
  {!loading&&!error&&rows.length===0&&<Card className="p-8 text-center text-slate-500">Nenhuma automação disponível para esta sessão.</Card>}
  <div className="space-y-3">{rows.map(a=><Card key={a.id} className="p-5"><div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
    <div><p className="font-bold">{a.name}</p><p className="text-sm text-slate-500">{a.company_key} · {a.trigger_description||'Trigger não descrito'}</p></div>
    <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1 w-fit">{a.status||'Sem status'}</span>
  </div><div className="grid md:grid-cols-3 gap-3 mt-4 text-sm"><p><span className="text-slate-500">Responsável:</span> {a.owner_agent||'Não definido'}</p><p><span className="text-slate-500">Última execução:</span> {a.last_run_at?new Date(a.last_run_at).toLocaleString('pt-BR'):'Sem evidência'}</p><p><span className="text-slate-500">Resultado:</span> {a.last_result||'Sem evidência'}</p></div></Card>)}</div>
 </div>
}
