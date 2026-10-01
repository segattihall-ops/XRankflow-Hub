'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { supabase } from '@/lib/supabase'

type Incident={
  id:number
  company_key:string
  severity:string
  title:string
  source:string|null
  detected_at:string
  status:string
  owner_agent:string|null
}

type SystemCheck={
  id:string
  system_key:string
  check_key:string
  status:string
  checked_at:string
  expires_at:string
  summary:string|null
  source:string|null
}

export default function HealthPage(){
  const [checks,setChecks]=useState<SystemCheck[]>([])
  const [incidents,setIncidents]=useState<Incident[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)

  async function load(){
    setLoading(true)
    setError(null)

    const [checkRes,incidentRes]=await Promise.all([
      supabase.from('xrmg_system_checks').select('id,system_key,check_key,status,checked_at,expires_at,summary,source').order('checked_at',{ascending:false}),
      supabase.from('xrmg_incident_register').select('id,company_key,severity,title,source,detected_at,status,owner_agent').order('detected_at',{ascending:false}).limit(50),
    ])

    const first=checkRes.error||incidentRes.error
    if(first) setError(first.message)
    else {
      setChecks((checkRes.data||[]) as SystemCheck[])
      setIncidents((incidentRes.data||[]) as Incident[])
    }
    setLoading(false)
  }

  useEffect(()=>{void load()},[])

  const now=Date.now()
  const normalized=useMemo(()=>checks.map(check=>{
    const stale=new Date(check.expires_at).getTime()<=now
    const raw=check.status.toUpperCase()
    const state=stale?'stale':(['PASS','OK','HEALTHY','READY','SUCCESS'].includes(raw)?'healthy':['WARN','WARNING','DEGRADED'].includes(raw)?'warning':['FAIL','FAILED','ERROR','DOWN'].includes(raw)?'failed':'unknown')
    return {...check,state}
  }),[checks,now])

  const activeIncidents=useMemo(()=>incidents.filter(i=>!['closed','resolved','done'].includes(i.status.toLowerCase())),[incidents])
  const counts=useMemo(()=>({
    healthy:normalized.filter(x=>x.state==='healthy').length,
    warning:normalized.filter(x=>x.state==='warning').length,
    failed:normalized.filter(x=>x.state==='failed').length,
    stale:normalized.filter(x=>x.state==='stale').length,
  }),[normalized])

  if(loading) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="loading" title="Carregando saúde do sistema" description="Lendo checks com validade e incidentes conhecidos."/></div>
  if(error) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="error" title="Monitoramento indisponível" description={error} source="xrmg_system_checks + xrmg_incident_register" onRetry={()=>void load()}/></div>

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">OBSERVABILITY</p>
    <h1 className="text-3xl font-black mt-1">Saúde do Sistema</h1>
    <p className="text-slate-500 mt-2 mb-8">Somente checks ainda válidos podem aparecer como saudáveis. Check vencido vira stale automaticamente.</p>

    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      <Metric label="Saudáveis" value={counts.healthy}/>
      <Metric label="Alertas" value={counts.warning}/>
      <Metric label="Falhas" value={counts.failed}/>
      <Metric label="Stale" value={counts.stale}/>
      <Metric label="Incidentes ativos" value={activeIncidents.length}/>
    </div>

    {checks.length===0
      ? <OperationalState
          kind="not-connected"
          title="Nenhum check ativo foi ingerido"
          description="Ausência de checks não significa sistema saudável. GitHub, Vercel, Supabase e demais serviços só poderão ficar verdes aqui quando um check recente e ainda válido for gravado no registro."
          source="xrmg_system_checks"
          actionLabel="Ver fontes e integrações"
          actionHref="/integrations"
        />
      : <Card className="p-5">
          <h2 className="font-bold text-xl">Checks</h2>
          <div className="divide-y divide-slate-100 mt-4">
            {normalized.map(check=><div key={check.id} className="py-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{check.system_key} · {check.check_key}</p>
                  <StateBadge state={check.state}/>
                </div>
                {check.summary&&<p className="text-sm text-slate-500 mt-1">{check.summary}</p>}
                <p className="text-xs text-slate-400 mt-2">{check.source||'Fonte não informada'}</p>
              </div>
              <div className="text-xs text-slate-400 lg:text-right">
                <p>Checked: {new Date(check.checked_at).toLocaleString('pt-BR')}</p>
                <p className="mt-1">Válido até: {new Date(check.expires_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>)}
          </div>
        </Card>}

    <Card className="p-5 mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-xl">Incidentes conhecidos</h2>
        <span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{incidents.length}</span>
      </div>
      {incidents.length===0
        ? <p className="text-sm text-slate-500 mt-5">Nenhum incidente visível. Isso não substitui checks ativos.</p>
        : <div className="space-y-3 mt-4">{incidents.map(i=><div key={i.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-bold">{i.title}</p>
                <p className="text-sm text-slate-500 mt-1">{i.company_key} · {i.source||'Fonte não informada'}</p>
              </div>
              <span className="text-xs rounded-full bg-slate-100 px-2.5 py-1 h-fit">{i.severity} · {i.status}</span>
            </div>
            <p className="text-xs text-slate-400 mt-3">{new Date(i.detected_at).toLocaleString('pt-BR')} · {i.owner_agent||'Sem responsável'}</p>
          </div>)}</div>}
    </Card>

    <Card className="p-5 mt-6 bg-slate-50">
      <p className="font-bold">Regra de saúde</p>
      <p className="text-sm text-slate-600 mt-2">Um serviço nunca fica verde apenas porque não há incidente. Para estado saudável, precisa existir um check recente cujo <code>expires_at</code> ainda não passou. O registro está pronto para receber checks de automações futuras.</p>
    </Card>
  </div>
}

function Metric({label,value}:{label:string;value:number}){
  return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className="text-3xl font-black mt-2">{value}</p></Card>
}

function StateBadge({state}:{state:string}){
  const tone=state==='healthy'?'bg-emerald-50 text-emerald-700':state==='warning'?'bg-amber-50 text-amber-700':state==='failed'?'bg-red-50 text-red-700':'bg-slate-100 text-slate-600'
  const label=state==='healthy'?'Healthy':state==='warning'?'Warning':state==='failed'?'Failed':state==='stale'?'Stale':'Unknown'
  return <span className={`text-xs rounded-full px-2.5 py-1 ${tone}`}>{label}</span>
}
