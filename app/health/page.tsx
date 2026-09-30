'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

type Incident={id:number;company_key:string;severity:string;title:string;source:string|null;detected_at:string;status:string;owner_agent:string|null}

export default function Page(){
 const [rows,setRows]=useState<Incident[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null)
 useEffect(()=>{supabase.from('xrmg_incident_register').select('id,company_key,severity,title,source,detected_at,status,owner_agent').order('detected_at',{ascending:false}).limit(30).then(({data,error})=>{if(error)setError(error.message);else setRows((data||[]) as Incident[]);setLoading(false)})},[])
 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">OBSERVABILITY</p><h1 className="text-3xl font-black mt-1">Saúde do Sistema</h1>
  <p className="text-slate-500 mt-2 mb-8">Incidentes conhecidos. Cinza significa ausência de monitoramento, não saúde.</p>
  {loading&&<Card className="p-8 text-center text-slate-500">Carregando incidentes…</Card>}
  {error&&<Card className="p-8 border-amber-200"><p className="font-bold text-amber-700">Monitoramento ainda não disponível para esta sessão.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
  {!loading&&!error&&rows.length===0&&<Card className="p-8"><p className="font-bold">Nenhum incidente visível</p><p className="text-sm text-slate-500 mt-2">Isso não prova que todos os sistemas estão funcionando. Checks ativos ainda precisam ser ligados ao OS.</p></Card>}
  <div className="space-y-3">{rows.map(i=><Card key={i.id} className="p-5"><div className="flex justify-between gap-3"><div><p className="font-bold">{i.title}</p><p className="text-sm text-slate-500">{i.company_key} · {i.source||'Fonte não informada'}</p></div><span className="text-xs rounded-full bg-slate-100 px-2.5 py-1 h-fit">{i.severity} · {i.status}</span></div><p className="text-xs text-slate-400 mt-3">{new Date(i.detected_at).toLocaleString('pt-BR')} · {i.owner_agent||'Sem responsável'}</p></Card>)}</div>
 </div>
}
