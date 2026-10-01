'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { supabase } from '@/lib/supabase'

type InboxItem = {
  id: string
  source_system: string
  source_item_id: string
  source_thread_id: string | null
  brand_key: string | null
  kind: string
  sender_name: string | null
  sender_address: string | null
  subject: string | null
  preview: string | null
  received_at: string
  status: string
  priority: string
  capabilities: Record<string, boolean> | null
  source_url: string | null
}

export default function InboxPage() {
  const [items,setItems]=useState<InboxItem[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [statusFilter,setStatusFilter]=useState('open')
  const [sourceFilter,setSourceFilter]=useState('All')

  async function load(){
    setLoading(true)
    setError(null)
    const {data,error}=await supabase
      .from('xrmg_inbox_items')
      .select('id,source_system,source_item_id,source_thread_id,brand_key,kind,sender_name,sender_address,subject,preview,received_at,status,priority,capabilities,source_url')
      .order('received_at',{ascending:false})
      .limit(100)

    if(error) setError(error.message)
    else setItems((data||[]) as InboxItem[])
    setLoading(false)
  }

  useEffect(()=>{void load()},[])

  const sources=useMemo(()=>Array.from(new Set(items.map(i=>i.source_system))).sort(),[items])
  const filtered=useMemo(()=>items.filter(i=>{
    const statusOk=statusFilter==='All'||i.status===statusFilter
    const sourceOk=sourceFilter==='All'||i.source_system===sourceFilter
    return statusOk&&sourceOk
  }),[items,statusFilter,sourceFilter])

  if(loading) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="loading" title="Carregando Inbox" description="Lendo itens já normalizados no XRANKFLOW OS."/></div>

  if(error) return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto"><OperationalState kind="error" title="Não foi possível abrir a Inbox" description={error} source="xrmg_inbox_items" onRetry={()=>void load()}/></div>

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <div className="mb-8">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">CAIXA OPERACIONAL CENTRAL</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">Inbox</h1>
      <p className="text-slate-500 mt-2">Modelo normalizado para email, suporte, leads e notificações com IDs de origem preservados.</p>
    </div>

    {items.length===0
      ? <OperationalState
          kind="not-connected"
          title="Modelo da Inbox pronto; fontes ainda não ingeridas"
          description="A tabela normalizada está ativa e protegida por RLS, mas nenhum conector externo está alimentando o OS ainda. Por isso, ausência de itens aqui não significa ausência de emails, leads ou tickets nas fontes originais."
          source="xrmg_inbox_items"
          actionLabel="Ver fontes e integrações"
          actionHref="/integrations"
        />
      : <>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
            <option value="open">Abertos</option>
            <option value="archived">Arquivados</option>
            <option value="resolved">Resolvidos</option>
            <option value="All">Todos</option>
          </select>
          <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
            <option value="All">Todas as fontes</option>
            {sources.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div className="text-sm text-slate-500 sm:ml-auto sm:self-center">{filtered.length} itens ingeridos no OS</div>
        </div>

        {filtered.length===0
          ? <OperationalState kind="empty" title="Nenhum item nesta visão" description="Os filtros atuais não retornaram itens normalizados." source="xrmg_inbox_items"/>
          : <div className="space-y-3">{filtered.map(item=><InboxCard key={item.id} item={item}/>)}</div>}
      </>}

    <Card className="p-5 mt-6 bg-slate-50">
      <p className="font-bold">Contrato de ingestão</p>
      <p className="text-sm text-slate-600 mt-2">Cada conector deverá gravar <code>source_system + source_item_id</code> de forma única. Isso evita duplicação e mantém rastreabilidade para a mensagem, lead ou ticket original.</p>
      <p className="text-xs text-slate-400 mt-3">Writes sobre a fonte original permanecem desabilitados até cada conector declarar capacidades reais de archive, reply, delegate ou resolve.</p>
    </Card>
  </div>
}

function InboxCard({item}:{item:InboxItem}) {
  const safeUrl=item.source_url&&/^https?:\/\//i.test(item.source_url)?item.source_url:null
  const enabledCapabilities=Object.entries(item.capabilities||{}).filter(([,enabled])=>enabled).map(([name])=>name)

  return <Card className="p-5">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold">{item.source_system}</span>
          <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-1">{item.kind}</span>
          <span className={`rounded-full px-2 py-1 ${item.priority==='urgent'?'bg-red-50 text-red-700':item.priority==='high'?'bg-amber-50 text-amber-700':'bg-slate-50 text-slate-600'}`}>{item.priority}</span>
        </div>
        <h2 className="font-bold mt-3">{item.subject||'Sem assunto'}</h2>
        <p className="text-sm text-slate-500 mt-1">{item.sender_name||item.sender_address||'Remetente não informado'}</p>
        {item.preview&&<p className="text-sm text-slate-700 mt-3">{item.preview}</p>}
        <p className="text-xs text-slate-400 mt-3">{new Date(item.received_at).toLocaleString('pt-BR')}</p>
        <p className="text-[10px] text-slate-300 mt-2 break-all">{item.source_system}:{item.source_item_id}</p>
      </div>

      <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
        <span className="text-xs rounded-full bg-slate-100 px-2.5 py-1">{item.status}</span>
        {safeUrl&&<a href={safeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><ExternalLink size={13}/>Abrir na fonte</a>}
        {enabledCapabilities.length>0&&<p className="text-[10px] text-slate-400 max-w-48 text-right">Capacidades: {enabledCapabilities.join(', ')}</p>}
      </div>
    </div>
  </Card>
}
