'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { supabase } from '@/lib/supabase'

type Automation={
  id:number
  automation_key:string
  name:string
  company_key:string|null
  trigger_type:string
  trigger_description:string|null
  human_approval:string|null
  failure_conditions:unknown
  logging_location:string|null
  recovery_procedure:string|null
  status:string
  owner_agent:string
  last_run_at:string|null
  last_result:string|null
  updated_at:string
}

export default function AutomationsPage(){
  const [rows,setRows]=useState<Automation[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [company,setCompany]=useState('All')

  async function load(){
    setLoading(true)
    setError(null)
    const {data,error}=await supabase
      .from('xrmg_automation_registry')
      .select('id,automation_key,name,company_key,trigger_type,trigger_description,human_approval,failure_conditions,logging_location,recovery_procedure,status,owner_agent,last_run_at,last_result,updated_at')
      .order('updated_at',{ascending:false})

    if(error) setError(error.message)
    else setRows((data||[]) as Automation[])
    setLoading(false)
  }

  useEffect(()=>{void load()},[])

  const companies=useMemo(()=>Array.from(new Set(rows.map(r=>r.company_key).filter((x):x is string=>Boolean(x)))).sort(),[rows])
  const filtered=useMemo(()=>company==='All'?rows:rows.filter(r=>r.company_key===company),[rows,company])
  const withEvidence=filtered.filter(r=>r.last_run_at).length
  const failed=filtered.filter(r=>/fail|error/i.test(r.last_result||'')).length
  const stale=filtered.filter(r=>r.last_run_at&&Date.now()-new Date(r.last_run_at).getTime()>7*24*60*60*1000).length

  if(loading) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="loading" title="Carregando automações" description="Lendo o catálogo operacional registrado no XRANKFLOW OS."/></div>
  if(error) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="error" title="Registro de automações indisponível" description={error} source="xrmg_automation_registry" onRetry={()=>void load()}/></div>

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
      <div>
        <p className="text-xs font-bold tracking-[0.18em] text-slate-500">OPERATIONS</p>
        <h1 className="text-3xl font-black mt-1">Automation Center</h1>
        <p className="text-slate-500 mt-2">Catálogo, evidência de execução, aprovação humana, logging e recuperação.</p>
      </div>
      <select value={company} onChange={e=>setCompany(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
        <option value="All">Todas as empresas</option>
        {companies.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
    </div>

    {rows.length===0
      ? <OperationalState kind="empty" title="Nenhuma automação registrada" description="O catálogo não retornou automações para esta sessão." source="xrmg_automation_registry"/>
      : <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Metric label="Registradas" value={filtered.length}/>
          <Metric label="Com evidência de run" value={withEvidence}/>
          <Metric label="Falhas registradas" value={failed}/>
          <Metric label="Sem run em 7+ dias" value={stale}/>
        </div>

        <div className="space-y-4">
          {filtered.map(a=>{
            const freshness=a.last_run_at?formatFreshness(a.last_run_at):'Sem evidência'
            return <Card key={a.id} className="p-5">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-lg">{a.name}</p>
                    <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{a.status||'Sem status'}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{a.company_key||'Holding'} · {a.trigger_type} · {a.trigger_description||'Trigger não descrito'}</p>
                  <p className="text-[10px] text-slate-300 mt-2 break-all">{a.automation_key}</p>
                </div>
                <div className="text-xs text-slate-500 xl:text-right">
                  <p>Última evidência: <b>{freshness}</b></p>
                  <p className="mt-1">Atualizado: {new Date(a.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5 text-sm">
                <Info label="Responsável" value={a.owner_agent||'Não definido'}/>
                <Info label="Aprovação humana" value={a.human_approval||'Não declarada'}/>
                <Info label="Último run" value={a.last_run_at?new Date(a.last_run_at).toLocaleString('pt-BR'):'Sem evidência'}/>
                <Info label="Último resultado" value={a.last_result||'Sem evidência'}/>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 mt-4">
                <Info label="Logging" value={a.logging_location||'Local de log não declarado'}/>
                <Info label="Recuperação" value={a.recovery_procedure||'Procedimento de recuperação não declarado'}/>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
                Execução manual permanece desabilitada até existir um executor autorizado e idempotente para esta automação. Próxima execução não é exibida porque o registro atual não possui um campo de schedule/next_run verificável.
              </div>
            </Card>
          })}
        </div>
      </>}
  </div>
}

function Metric({label,value}:{label:string;value:number}){
  return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className="text-3xl font-black mt-2">{value}</p></Card>
}

function Info({label,value}:{label:string;value:string}){
  return <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words">{value}</p></div>
}

function formatFreshness(value:string){
  const delta=Date.now()-new Date(value).getTime()
  if(delta<0) return 'timestamp futuro'
  const hours=Math.floor(delta/(60*60*1000))
  if(hours<1) return 'há menos de 1h'
  if(hours<24) return `há ${hours}h`
  const days=Math.floor(hours/24)
  return `há ${days}d`
}
