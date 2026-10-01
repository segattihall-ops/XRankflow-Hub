'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { supabase } from '@/lib/supabase'

type Entity = {
  id: string
  source_system: string
  source_entity_id: string
  brand_key: string | null
  entity_type: string
  display_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  lifecycle_status: string | null
  source_url: string | null
}

type Opportunity = {
  id: string
  source_system: string
  source_opportunity_id: string
  crm_entity_id: string | null
  brand_key: string | null
  name: string
  stage: string | null
  amount: number | null
  currency: string | null
  expected_close_at: string | null
  status: string | null
  source_url: string | null
}

type Timeline = {
  id: string
  source_system: string
  source_event_id: string
  crm_entity_id: string | null
  brand_key: string | null
  event_type: string
  summary: string | null
  occurred_at: string
  source_url: string | null
}

export default function CRMPage() {
  const [entities,setEntities]=useState<Entity[]>([])
  const [opportunities,setOpportunities]=useState<Opportunity[]>([])
  const [timeline,setTimeline]=useState<Timeline[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [brandFilter,setBrandFilter]=useState('All')

  async function load(){
    setLoading(true)
    setError(null)
    const [entitiesRes,oppsRes,timelineRes]=await Promise.all([
      supabase.from('xrmg_crm_entities').select('*').order('updated_at',{ascending:false}).limit(200),
      supabase.from('xrmg_crm_opportunities').select('*').order('updated_at',{ascending:false}).limit(200),
      supabase.from('xrmg_crm_timeline').select('*').order('occurred_at',{ascending:false}).limit(30),
    ])
    const first=entitiesRes.error||oppsRes.error||timelineRes.error
    if(first) setError(first.message)
    else {
      setEntities((entitiesRes.data||[]) as Entity[])
      setOpportunities((oppsRes.data||[]) as Opportunity[])
      setTimeline((timelineRes.data||[]) as Timeline[])
    }
    setLoading(false)
  }

  useEffect(()=>{void load()},[])

  const brands=useMemo(()=>Array.from(new Set([
    ...entities.map(x=>x.brand_key),
    ...opportunities.map(x=>x.brand_key),
  ].filter((x):x is string=>Boolean(x)))).sort(),[entities,opportunities])

  const filteredEntities=useMemo(()=>brandFilter==='All'?entities:entities.filter(x=>x.brand_key===brandFilter),[entities,brandFilter])
  const filteredOpps=useMemo(()=>brandFilter==='All'?opportunities:opportunities.filter(x=>x.brand_key===brandFilter),[opportunities,brandFilter])
  const filteredTimeline=useMemo(()=>brandFilter==='All'?timeline:timeline.filter(x=>x.brand_key===brandFilter),[timeline,brandFilter])

  const stageCounts=useMemo(()=>{
    const counts=new Map<string,number>()
    filteredOpps.forEach(o=>counts.set(o.stage||'Sem estágio',(counts.get(o.stage||'Sem estágio')||0)+1))
    return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1])
  },[filteredOpps])

  if(loading) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="loading" title="Carregando CRM" description="Lendo entidades, oportunidades e timeline já federadas no XRANKFLOW OS."/></div>
  if(error) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="error" title="Não foi possível abrir o CRM" description={error} source="xrmg_crm_*" onRetry={()=>void load()}/></div>

  const hasData=entities.length>0||opportunities.length>0||timeline.length>0

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <div className="mb-8">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">REVENUE OPERATIONS</p>
      <h1 className="text-3xl font-black mt-1">CRM Central</h1>
      <p className="text-slate-500 mt-2">Federação read-only de entidades, oportunidades e relacionamento sem substituir o CRM autoritativo de cada empresa.</p>
    </div>

    {!hasData
      ? <OperationalState
          kind="not-connected"
          title="Modelo federado pronto; fontes de CRM ainda não ingeridas"
          description="As tabelas normalizadas e a deduplicação por source_system + external ID estão prontas. Nenhum valor de leads, clientes ou pipeline será tratado como zero enquanto os CRMs autoritativos não estiverem conectados."
          source="xrmg_crm_entities / xrmg_crm_opportunities / xrmg_crm_timeline"
          actionLabel="Ver fontes e integrações"
          actionHref="/integrations"
        />
      : <>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
            <option value="All">Todas as empresas</option>
            {brands.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Metric label="Entidades federadas" value={filteredEntities.length}/>
          <Metric label="Oportunidades federadas" value={filteredOpps.length}/>
          <Metric label="Eventos recentes" value={filteredTimeline.length}/>
          <Metric label="Fontes distintas" value={new Set([...filteredEntities.map(x=>x.source_system),...filteredOpps.map(x=>x.source_system)]).size}/>
        </div>

        <div className="grid xl:grid-cols-[2fr_1fr] gap-6">
          <Card className="p-5">
            <h2 className="font-bold text-xl">Entidades</h2>
            {filteredEntities.length===0?<p className="text-sm text-slate-500 mt-5">Nenhuma entidade nesta visão.</p>:<div className="divide-y divide-slate-100 mt-4">
              {filteredEntities.slice(0,100).map(entity=><div key={entity.id} className="py-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <p className="font-semibold">{entity.display_name||entity.company_name||'Sem nome'}</p>
                  <p className="text-sm text-slate-500 mt-1">{entity.entity_type} · {entity.lifecycle_status||'Sem lifecycle'} · {entity.source_system}</p>
                  {(entity.email||entity.phone)&&<p className="text-xs text-slate-400 mt-1">{[entity.email,entity.phone].filter(Boolean).join(' · ')}</p>}
                  <p className="text-[10px] text-slate-300 mt-2 break-all">{entity.source_system}:{entity.source_entity_id}</p>
                </div>
                {safeUrl(entity.source_url)&&<a href={safeUrl(entity.source_url) as string} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><ExternalLink size={13}/>Abrir na fonte</a>}
              </div>)}
            </div>}
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="font-bold">Pipeline por estágio</h2>
              <p className="text-xs text-slate-500 mt-1">Contagem somente de oportunidades ingeridas. Valores monetários não são somados entre moedas.</p>
              <div className="mt-4 space-y-3">
                {stageCounts.length===0?<p className="text-sm text-slate-500">Nenhuma oportunidade.</p>:stageCounts.map(([stage,count])=><div key={stage} className="flex justify-between text-sm"><span>{stage}</span><b>{count}</b></div>)}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-bold">Timeline recente</h2>
              <div className="mt-4 space-y-3">
                {filteredTimeline.length===0?<p className="text-sm text-slate-500">Nenhum evento federado.</p>:filteredTimeline.slice(0,12).map(event=><div key={event.id} className="border-b border-slate-100 pb-3">
                  <p className="text-sm font-semibold">{event.event_type}</p>
                  {event.summary&&<p className="text-xs text-slate-500 mt-1">{event.summary}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{event.source_system} · {new Date(event.occurred_at).toLocaleString('pt-BR')}</p>
                </div>)}
              </div>
            </Card>
          </div>
        </div>
      </>}

    <Card className="p-5 mt-6 bg-slate-50">
      <p className="font-bold">Regra de autoridade</p>
      <p className="text-sm text-slate-600 mt-2">O XRANKFLOW OS é a camada de operação federada. O CRM conectado continua sendo a fonte autoritativa. IDs externos são preservados e o navegador não possui write access às tabelas federadas.</p>
    </Card>
  </div>
}

function Metric({label,value}:{label:string;value:number}) {
  return <Card className="p-5"><p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p><p className="text-3xl font-black mt-2">{value}</p></Card>
}

function safeUrl(value:string|null){
  return value&&/^https?:\/\//i.test(value)?value:null
}
