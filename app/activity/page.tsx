'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

type Row={id:string;kind:'Task'|'Finance';label:string;actor:string;created_at:string}

export default function ActivityPage(){
 const [rows,setRows]=useState<Row[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState<string|null>(null)

 useEffect(()=>{
  Promise.all([
   supabase.from('wh_tasks').select('id,title,created_at,owner_role').order('created_at',{ascending:false}).limit(10),
   supabase.from('wh_finance').select('id,item,created_at').order('created_at',{ascending:false}).limit(10),
  ]).then(([t,f])=>{
   const first=t.error||f.error
   if(first)setError(first.message)
   else {
    const taskRows=(t.data||[]).map(x=>({id:x.id,kind:'Task' as const,label:x.title,actor:x.owner_role||'Responsável não definido',created_at:x.created_at}))
    const finRows=(f.data||[]).map(x=>({id:x.id,kind:'Finance' as const,label:x.item,actor:'Finance',created_at:x.created_at}))
    setRows([...taskRows,...finRows].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()))
   }
   setLoading(false)
  })
 },[])

 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">ATIVIDADE RECENTE</p>
  <h1 className="text-3xl font-black mt-1">Activity</h1>
  <p className="text-slate-500 mt-2 mb-8">Eventos recentes reconstruídos a partir de registros atuais. Esta tela ainda não é um audit log imutável.</p>
  {loading&&<Card className="p-8 text-center text-slate-500">Carregando atividade…</Card>}
  {error&&<Card className="p-8 border-red-200"><p className="font-bold text-red-700">Não foi possível carregar atividade.</p><p className="text-sm text-slate-500 mt-2">{error}</p></Card>}
  {!loading&&!error&&rows.length===0&&<Card className="p-12 text-center"><Activity size={42} className="mx-auto text-slate-300"/><p className="font-semibold mt-3">Nenhuma atividade disponível</p></Card>}
  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
   {rows.map(r=><div key={r.kind+r.id} className="p-4 flex justify-between gap-4"><div><p className="font-semibold text-sm">{r.label}</p><p className="text-xs text-slate-500 mt-1">{r.kind} · {r.actor}</p></div><p className="text-xs text-slate-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-BR')}</p></div>)}
  </div>
 </div>
}
