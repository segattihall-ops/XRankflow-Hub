'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buildMultichannelPack, type Brand, type ContentItem } from '@/lib/social-media-os'

type Campaign = {
  id: string
  brand_id: string
  name: string
  objective?: string | null
  paused: boolean
}

type Account = {
  id: string
  brand_id: string
  platform: string
  handle: string
  status: string
  paused: boolean
}

type Fact = {
  id: string
  brand_id: string
  fact_text: string
  status: string
}

const statusLabel: Record<string, string> = {
  planejado: 'Rascunho',
  gerado: 'Gerado',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
  agendado: 'Agendado',
  enviado_api: 'Publicando',
  publicado: 'Publicado',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}

const panel = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500'

export default function SocialMediaOSPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [content, setContent] = useState<ContentItem[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId) ?? null,
    [brands, selectedBrandId],
  )

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    const [brandsRes, campaignsRes, contentRes, accountsRes, factsRes] = await Promise.all([
      supabase.from('sm_brands').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_content').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('sm_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_brand_facts').select('id,brand_id,fact_text,status').order('created_at', { ascending: false }),
    ])
    const firstError = brandsRes.error || campaignsRes.error || contentRes.error || accountsRes.error || factsRes.error
    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }
    const nextBrands = (brandsRes.data ?? []) as Brand[]
    setBrands(nextBrands)
    setCampaigns((campaignsRes.data ?? []) as Campaign[])
    setContent((contentRes.data ?? []) as ContentItem[])
    setAccounts((accountsRes.data ?? []) as Account[])
    setFacts((factsRes.data ?? []) as Fact[])
    setSelectedBrandId((current) => current || nextBrands[0]?.id || '')
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const filteredContent = useMemo(
    () => content.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [content, selectedBrandId],
  )
  const filteredCampaigns = useMemo(
    () => campaigns.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [campaigns, selectedBrandId],
  )
  const filteredAccounts = useMemo(
    () => accounts.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [accounts, selectedBrandId],
  )

  async function createBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const website = String(form.get('website') || '').trim()
    const niche = String(form.get('niche') || '').trim()
    if (!name) return
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const prefix = slug.replace(/-/g, '').slice(0, 6).toUpperCase() || 'BRAND'
    setBusy(true)
    const { error: insertError } = await supabase.from('sm_brands').insert({
      name,
      slug,
      code_prefix: prefix,
      status: 'ativa',
      website: website || null,
      niche: niche || null,
      audiences: [],
      languages: ['en'],
      colors: [],
      fonts: [],
      logos: [],
      visual_refs: [],
      products: [],
      offers: [],
      links: website ? { website } : {},
      rules: {},
      cadence: {},
      owners: [],
      approval_mode: 'revisao',
      sources: [],
      gaps: [],
      regions: [],
      forbidden_words: [],
      content_pillars: [],
      objectives: [],
      competitor_urls: [],
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice('Marca criada.')
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrandId) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const objective = String(form.get('objective') || '').trim()
    if (!name) return
    setBusy(true)
    const { error: insertError } = await supabase.from('sm_campaigns').insert({
      brand_id: selectedBrandId,
      name,
      objective: objective || null,
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice('Campanha criada.')
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function generatePack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrand) return
    const form = new FormData(event.currentTarget)
    const topic = String(form.get('topic') || '').trim()
    const audience = String(form.get('audience') || '').trim()
    const objective = String(form.get('objective') || '').trim()
    const cta = String(form.get('cta') || '').trim()
    const campaignId = String(form.get('campaign_id') || '').trim() || null
    if (!topic) return
    const approvedFacts = facts.filter((fact) => fact.brand_id === selectedBrand.id && fact.status === 'approved').map((fact) => fact.fact_text)
    const drafts = buildMultichannelPack({
      brand: selectedBrand,
      topic,
      audience,
      objective,
      cta,
      destinationUrl: selectedBrand.website || undefined,
      language: selectedBrand.languages[0] || 'en',
      approvedFacts,
    })
    const base = Date.now().toString(36).toUpperCase()
    setBusy(true)
    const rows = drafts.map((draft, index) => ({
      brand_id: selectedBrand.id,
      campaign_id: campaignId,
      code: `${selectedBrand.code_prefix}-${base}-${index + 1}`,
      audience: audience || null,
      objective: objective || null,
      theme: topic,
      platform: draft.platform,
      format: draft.format,
      language: selectedBrand.languages[0] || 'en',
      caption: draft.caption,
      cta: cta || null,
      url: selectedBrand.website || null,
      final_url: selectedBrand.website || null,
      art_text: draft.artText || null,
      alt_text: draft.altText || null,
      script: draft.script || null,
      sources: approvedFacts.map((fact) => ({ type: 'approved_fact', fact })),
      status: 'em_revisao',
      production_status: draft.format === 'video_curto' ? 'production_required' : 'draft',
      payload: draft.payload,
      timezone: selectedBrand.timezone || 'America/Chicago',
      validation: draft.platform === 'x' ? { thread_validated: true } : {},
    }))
    const { error: insertError } = await supabase.from('sm_content').insert(rows)
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice(`${rows.length} peças multicanal criadas e enviadas para revisão.`)
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function updateStatus(item: ContentItem, status: string) {
    setBusy(true)
    const patch: Record<string, unknown> = { status }
    if (status === 'aprovado') {
      const { data: userData } = await supabase.auth.getUser()
      patch.approved_by = userData.user?.email || 'authenticated-user'
      patch.approved_at = new Date().toISOString()
    }
    const { error: updateError } = await supabase.from('sm_content').update(patch).eq('id', item.id)
    setBusy(false)
    if (updateError) setError(updateError.message)
    else {
      setNotice(`Status atualizado para ${statusLabel[status] || status}.`)
      await loadAll()
    }
  }

  async function scheduleItem(item: ContentItem) {
    const when = window.prompt('Data/hora ISO para agendar (ex.: 2026-10-01T15:00:00-05:00)')
    if (!when) return
    const parsed = new Date(when)
    if (Number.isNaN(parsed.getTime())) {
      setError('Data/hora inválida.')
      return
    }
    setBusy(true)
    const { error: updateError } = await supabase
      .from('sm_content')
      .update({ status: 'agendado', scheduled_for: parsed.toISOString() })
      .eq('id', item.id)
      .eq('status', 'aprovado')
    setBusy(false)
    if (updateError) setError(updateError.message)
    else {
      setNotice('Conteúdo agendado. Publicação externa só ocorrerá quando houver conta/integrador conectado e worker autorizado.')
      await loadAll()
    }
  }

  async function togglePauseBrand() {
    if (!selectedBrand) return
    setBusy(true)
    const next = !selectedBrand.paused
    const { error: updateError } = await supabase.from('sm_brands').update({ paused: next }).eq('id', selectedBrand.id)
    setBusy(false)
    if (updateError) setError(updateError.message)
    else {
      setNotice(next ? 'Marca pausada.' : 'Marca reativada.')
      await loadAll()
    }
  }

  const stats = {
    review: filteredContent.filter((item) => item.status === 'em_revisao').length,
    approved: filteredContent.filter((item) => item.status === 'aprovado').length,
    scheduled: filteredContent.filter((item) => item.status === 'agendado').length,
    failed: filteredContent.filter((item) => item.status === 'falhou').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Social Media OS</p>
            <h1 className="mt-2 text-3xl font-bold">Conteúdo multicanal, aprovação e operação</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Configuração dinâmica por marca. O sistema não considera uma publicação concluída sem confirmação externa.
            </p>
          </div>
          <button
            onClick={() => void loadAll()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
          >
            <RefreshCcw size={16} /> Atualizar
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError('')}><XCircle size={18} /></button>
          </div>
        )}
        {notice && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">{notice}</div>
            <button onClick={() => setNotice('')}><XCircle size={18} /></button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          {([
            ['Em revisão', stats.review, Sparkles],
            ['Aprovados', stats.approved, CheckCircle2],
            ['Agendados', stats.scheduled, CalendarDays],
            ['Falhas', stats.failed, CircleAlert],
          ] as const).map(([label, value, Icon]) => (
            <div key={String(label)} className={panel}>
              <Icon size={20} className="text-blue-600" />
              <div className="mt-3 text-2xl font-bold">{String(value)}</div>
              <div className="text-sm text-gray-500">{String(label)}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className={panel}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Marca ativa</h2>
                <p className="text-xs text-gray-500">Dados, regras e conteúdo ficam isolados por marca.</p>
              </div>
              {selectedBrand && (
                <button onClick={() => void togglePauseBrand()} className="rounded-lg border px-3 py-2 text-xs font-medium">
                  {selectedBrand.paused ? <PlayCircle size={15} className="inline mr-1" /> : <PauseCircle size={15} className="inline mr-1" />}
                  {selectedBrand.paused ? 'Reativar' : 'Pausar'}
                </button>
              )}
            </div>
            <select className={input} value={selectedBrandId} onChange={(event) => setSelectedBrandId(event.target.value)}>
              <option value="">Selecione</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            {selectedBrand && (
              <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div><b>Status:</b> {selectedBrand.paused ? 'Pausada' : selectedBrand.status}</div>
                <div><b>Website:</b> {selectedBrand.website || 'não informado'}</div>
                <div><b>Nicho:</b> {selectedBrand.niche || 'não informado'}</div>
                <div><b>Fuso:</b> {selectedBrand.timezone}</div>
                <div><b>Modo:</b> {selectedBrand.approval_mode === 'automatico' ? 'Automático' : 'Semiautomático / revisão'}</div>
              </div>
            )}
            <details className="mt-5">
              <summary className="cursor-pointer text-sm font-semibold">Cadastrar nova marca</summary>
              <form onSubmit={createBrand} className="mt-3 space-y-3">
                <input className={input} name="name" placeholder="Nome da marca" required />
                <input className={input} name="website" placeholder="Website" />
                <input className={input} name="niche" placeholder="Nicho / categoria" />
                <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  <Plus size={16} /> Criar marca
                </button>
              </form>
            </details>
          </section>

          <section className={panel}>
            <h2 className="text-lg font-bold">Gerar pacote multicanal</h2>
            <p className="mt-1 text-xs text-gray-500">
              Usa configuração da marca e somente fatos aprovados. Vídeos ficam marcados como produção pendente.
            </p>
            <form onSubmit={generatePack} className="mt-4 grid gap-3 md:grid-cols-2">
              <input className={input} name="topic" placeholder="Tema" required />
              <input className={input} name="audience" placeholder="Público" />
              <input className={input} name="objective" placeholder="Objetivo" />
              <input className={input} name="cta" placeholder="CTA" />
              <select className={input} name="campaign_id">
                <option value="">Sem campanha</option>
                {filteredCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              </select>
              <button disabled={busy || !selectedBrand} className="flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Gerar pacote
              </button>
            </form>

            <details className="mt-5 border-t pt-4">
              <summary className="cursor-pointer text-sm font-semibold">Criar campanha</summary>
              <form onSubmit={createCampaign} className="mt-3 grid gap-3 md:grid-cols-3">
                <input className={input} name="name" placeholder="Nome da campanha" required />
                <input className={input} name="objective" placeholder="Objetivo" />
                <button disabled={busy || !selectedBrand} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Criar</button>
              </form>
            </details>
          </section>
        </div>

        <section className={panel}>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Biblioteca e aprovação</h2>
              <p className="text-xs text-gray-500">Editar conteúdo aprovado deve gerar nova versão antes de republicar; esta tela mantém aprovação explícita.</p>
            </div>
            <div className="text-xs text-gray-500">{filteredContent.length} itens</div>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Carregando…</div>
          ) : filteredContent.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">Nenhum conteúdo para esta marca.</div>
          ) : (
            <div className="space-y-3">
              {filteredContent.map((item) => (
                <article key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase">{item.platform}</span>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{item.format}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-1">{statusLabel[item.status] || item.status}</span>
                        <span className="text-gray-400">v{item.version}</span>
                      </div>
                      <h3 className="mt-3 font-semibold">{item.theme || item.code}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.caption || 'Sem legenda'}</p>
                      {item.scheduled_for && <p className="mt-2 text-xs text-gray-500">Agendado: {new Date(item.scheduled_for).toLocaleString()}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.status === 'em_revisao' && (
                        <>
                          <button onClick={() => void updateStatus(item, 'aprovado')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Aprovar</button>
                          <button onClick={() => void updateStatus(item, 'cancelado')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Rejeitar</button>
                        </>
                      )}
                      {item.status === 'aprovado' && (
                        <button onClick={() => void scheduleItem(item)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                          <CalendarDays size={14} /> Agendar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={panel}>
            <div className="flex items-center gap-2">
              <Send size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold">Contas e publicação</h2>
            </div>
            <p className="mt-1 text-xs text-gray-500">Contas detectadas no banco. Nenhuma publicação é considerada concluída sem ID externo confirmado.</p>
            <div className="mt-4 space-y-2">
              {filteredAccounts.length === 0 ? (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Nenhuma conta social conectada para esta marca.</div>
              ) : filteredAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div><b>{account.platform}</b> · {account.handle}</div>
                  <span className="text-xs text-gray-500">{account.status}{account.paused ? ' · pausada' : ''}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={panel}>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold">Estado operacional</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Base multimarcas + RLS</span><b className="text-emerald-700">Ativa</b></div>
              <div className="flex justify-between"><span>Geração multicanal determinística</span><b className="text-emerald-700">Ativa</b></div>
              <div className="flex justify-between"><span>Aprovação e agendamento</span><b className="text-emerald-700">Ativos</b></div>
              <div className="flex justify-between"><span>Publicação externa</span><b className="text-amber-700">Aguardando integrador conectado</b></div>
              <div className="flex justify-between"><span>Pesquisa externa automática</span><b className="text-amber-700">Aguardando provedor autorizado</b></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
