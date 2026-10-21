'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { OperationalState } from '@/components/ui/OperationalState'
import { isReadResponse, isRecord, type ReadCommand, type ReadResponse } from '@/lib/ai-read-contract'
import { sourceRegistry } from '@/lib/source-registry'
import { supabase } from '@/lib/supabase'

type BrandOption = { id: string; name: string; slug: string }
const choices = [
  ['attention', 'O que precisa de atenção?'],
  ['overdue', 'Tarefas atrasadas'],
  ['health', 'Saúde do sistema'],
  ['company_status', 'Status da empresa'],
  ['source_lookup', 'Fonte de verdade'],
] as const

export default function Page() {
  const [command, setCommand] = useState<ReadCommand>('attention')
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [brandSlug, setBrandSlug] = useState('')
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [brandsError, setBrandsError] = useState<string | null>(null)
  const [sourceKey, setSourceKey] = useState(sourceRegistry[0]?.key || '')
  const [response, setResponse] = useState<ReadResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const brandRequestId = useRef(0)
  const controller = useRef<AbortController | null>(null)

  const loadBrands = useCallback(async () => {
    const id = ++brandRequestId.current
    setBrandsLoading(true)
    setBrandsError(null)
    try {
      const result = await supabase.from('wh_brands').select('id,name,slug').order('sort', { ascending: true })
      if (id !== brandRequestId.current) return
      if (result.error || !Array.isArray(result.data) || !result.data.every((item: unknown) =>
        isRecord(item) && ['id', 'name', 'slug'].every(key => typeof item[key] === 'string' && String(item[key]).trim()))) {
        throw new Error('Brand list unavailable')
      }
      const rows = result.data as BrandOption[]
      setBrands(rows)
      setBrandSlug(current => rows.some(brand => brand.slug === current) ? current : rows[0]?.slug || '')
    } catch {
      if (id === brandRequestId.current) setBrandsError('Não foi possível carregar as empresas. Tente novamente.')
    } finally {
      if (id === brandRequestId.current) setBrandsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBrands()
    return () => {
      brandRequestId.current += 1
      requestId.current += 1
      controller.current?.abort()
    }
  }, [loadBrands])

  function invalidate() {
    requestId.current += 1
    controller.current?.abort()
    setLoading(false)
    setResponse(null)
    setError(null)
  }

  async function run() {
    const id = ++requestId.current
    controller.current?.abort()
    const nextController = new AbortController()
    controller.current = nextController
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const result = await fetch('/api/ai/read', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: nextController.signal,
        body: JSON.stringify({ command, brand_slug: brandSlug, source_key: sourceKey }),
      })
      const data: unknown = await result.json().catch(() => null)
      if (id !== requestId.current) return
      if (!result.ok) {
        setError(isRecord(data) && typeof data.error === 'string' && data.error.trim() ?
          data.error : 'Consulta não concluída. Tente novamente.')
      } else if (!isReadResponse(data, command)) {
        setError('A fonte retornou uma resposta incompleta. Tente novamente.')
      } else {
        setResponse(data)
      }
    } catch {
      if (id === requestId.current) setError('Não foi possível confirmar a consulta. Verifique a conexão e tente novamente.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  const companyUnavailable = command === 'company_status' && (brandsLoading || !!brandsError || !brandSlug)

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
    <h1 className="text-3xl font-black text-slate-950">AI Command Center</h1>
    <p className="text-slate-500 mt-2 mb-8">Consulte tarefas, indicadores e registros de saúde das fontes autorizadas.</p>

    <div className="flex gap-2 overflow-x-auto pb-2 mb-5" aria-label="Tipo de consulta">
      {choices.map(([key, label]) => <button key={key} type="button" aria-pressed={command === key}
        onClick={() => { invalidate(); setCommand(key) }}
        className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${command === key ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200'}`}>{label}</button>)}
    </div>

    <Card className="p-5 mb-5">
      {command === 'company_status' && <label className="block mb-4 text-sm font-medium" htmlFor="ai-company">Empresa
        <select id="ai-company" value={brandSlug} disabled={brandsLoading || !!brandsError}
          onChange={event => { invalidate(); setBrandSlug(event.target.value) }}
          className="block w-full mt-2 px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
          {!brands.length && <option value="">{brandsLoading ? 'Carregando empresas…' : 'Nenhuma empresa disponível'}</option>}
          {brands.map(brand => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}
        </select>
      </label>}
      {command === 'source_lookup' && <label className="block mb-4 text-sm font-medium" htmlFor="ai-source">Fonte
        <select id="ai-source" value={sourceKey} onChange={event => { invalidate(); setSourceKey(event.target.value) }}
          className="block w-full mt-2 px-3 py-2.5 rounded-lg border border-slate-300 bg-white">
          {sourceRegistry.map(source => <option key={source.key} value={source.key}>{source.name}</option>)}
        </select>
      </label>}
      <Button onClick={() => void run()} disabled={loading || companyUnavailable}><Search size={16} />{loading ? 'Consultando…' : 'Executar consulta'}</Button>
    </Card>

    <div aria-live="polite">
      {command === 'company_status' && brandsError && <OperationalState kind="error" title="Empresas indisponíveis" description={brandsError} onRetry={() => void loadBrands()} />}
      {command === 'company_status' && !brandsLoading && !brandsError && !brands.length && <OperationalState kind="empty" title="Nenhuma empresa acessível" description="Não há empresas visíveis para esta sessão." />}
      {loading && <OperationalState kind="loading" title="Consultando fontes" description="Aguarde o resultado da consulta selecionada." />}
      {error && <OperationalState kind="error" title="Consulta não concluída" description={error} onRetry={() => void run()} />}
      {response && <Card className="p-6">
        <h2 className="text-xs font-bold tracking-wider text-slate-500">RESULTADO DA CONSULTA</h2>
        <div className="mt-4 space-y-2">{response.summary.map((line, index) => <p key={index} className="text-lg font-semibold">{line}</p>)}</div>
        <p className="text-sm text-slate-600 mt-4">{response.scope}</p>
        {response.coverage?.partial && <p className="text-sm text-amber-800 mt-3">Cobertura parcial: {response.coverage.returned} de {response.coverage.total} registros. As contagens de validade descrevem somente os registros consultados.</p>}
        <div className="flex flex-wrap gap-2 mt-5">{response.sources.map(source => <span key={source} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{source}</span>)}</div>
        <p className="text-xs text-slate-400 mt-4">Consulta realizada em {new Date(response.generated_at).toLocaleString('pt-BR')}</p>
      </Card>}
    </div>
  </div>
}
