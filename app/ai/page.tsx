'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { sourceRegistry } from '@/lib/source-registry'
import { supabase, type BrandRecord } from '@/lib/supabase'

type Command='attention'|'overdue'|'health'|'company_status'|'source_lookup'
type ResponseData={generated_at:string;sources:string[];summary?:string[]}

const choices=[
  ['attention','O que precisa atenção?'],
  ['overdue','Tarefas atrasadas'],
  ['health','Saúde do sistema'],
  ['company_status','Status da empresa'],
  ['source_lookup','Fonte de verdade'],
] as const

export default function Page(){
  const [command,setCommand]=useState<Command>('attention')
  const [brands,setBrands]=useState<BrandRecord[]>([])
  const [brandSlug,setBrandSlug]=useState('')
  const [sourceKey,setSourceKey]=useState(sourceRegistry[0]?.key||'')
  const [response,setResponse]=useState<ResponseData|null>(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    supabase.from('wh_brands').select('*').order('sort',{ascending:true}).then(({data})=>{
      const rows=(data||[]) as BrandRecord[]
      setBrands(rows)
      setBrandSlug(rows[0]?.slug||'')
    })
  },[])

  async function run(){
    setLoading(true)
    setError(null)
    setResponse(null)
    const res=await fetch('/api/ai/read',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({command,brand_slug:brandSlug,source_key:sourceKey}),
    })
    const data=await res.json().catch(()=>null)
    if(!res.ok||!data) setError(data?.error||'Consulta não concluída.')
    else setResponse(data as ResponseData)
    setLoading(false)
  }

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">READ-ONLY INTELLIGENCE</p>
    <h1 className="text-3xl font-black mt-1">AI Command Center</h1>
    <p className="text-slate-500 mt-2 mb-8">Consultas determinísticas em fontes autorizadas. Sem writes nesta fase.</p>

    <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
      {choices.map(([key,label])=><button key={key} onClick={()=>{setCommand(key);setResponse(null)}} className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${command===key?'bg-slate-950 text-white':'bg-white border border-slate-200'}`}>{label}</button>)}
    </div>

    <Card className="p-5 mb-5">
      {command==='company_status'&&<select value={brandSlug} onChange={e=>setBrandSlug(e.target.value)} className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
        {brands.map(b=><option key={b.id} value={b.slug}>{b.name}</option>)}
      </select>}
      {command==='source_lookup'&&<select value={sourceKey} onChange={e=>setSourceKey(e.target.value)} className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
        {sourceRegistry.map(s=><option key={s.key} value={s.key}>{s.name}</option>)}
      </select>}
      <Button onClick={()=>void run()} disabled={loading||(command==='company_status'&&!brandSlug)}><Search size={16}/>{loading?'Consultando…':'Executar consulta'}</Button>
    </Card>

    {loading&&<OperationalState kind="loading" title="Consultando fontes" description="Lendo apenas as fontes declaradas para este comando."/>}
    {error&&<OperationalState kind="error" title="Consulta não concluída" description={error} onRetry={()=>void run()}/>}

    {response&&<Card className="p-6">
      <p className="text-xs font-bold tracking-wider text-slate-500">RESULTADO VERIFICÁVEL</p>
      <div className="mt-4 space-y-2">{(response.summary||['Consulta concluída.']).map((line,i)=><p key={i} className="text-lg font-semibold">{line}</p>)}</div>
      <div className="flex flex-wrap gap-2 mt-5">{response.sources.map(s=><span key={s} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{s}</span>)}</div>
      <p className="text-xs text-slate-400 mt-4">{new Date(response.generated_at).toLocaleString('pt-BR')}</p>
    </Card>}

    <Card className="p-5 mt-6 bg-slate-50">
      <p className="font-bold">Escopo atual</p>
      <p className="text-sm text-slate-600 mt-2">Esta etapa usa código determinístico para perguntas determinísticas. Linguagem natural livre e ações de escrita permanecem fora do escopo até existir uma camada de ferramentas autorizadas e auditáveis.</p>
    </Card>
  </div>
}
