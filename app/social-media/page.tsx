'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  XCircle,
  Layers,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buildMultichannelPack, buildTemplatePlan, type Brand, type ContentItem, type SocialTemplate } from '@/lib/social-media-os'

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
  provider?: string | null
  provider_channel_id?: string | null
  buffer_channel_id?: string | null
}

type Fact = {
  id: string
  brand_id: string
  category: string
  fact_text: string
  status: string
  source_name?: string | null
  source_url?: string | null
  approved_at?: string | null
}

type Asset = {
  id: string
  brand_id: string
  kind: string
  name: string
  url: string
  approved: boolean
  metadata: Record<string, unknown>
}

type QueueItem = {
  id: string
  content_id: string
  brand_id: string
  account_id: string
  status: string
  due_at: string
  attempts: number
  max_attempts: number
  external_post_id?: string | null
  external_url?: string | null
  last_error?: string | null
}

type CreativeRender = {
  id: string
  brand_id: string
  content_id: string
  template_id: string
  provider: string
  status: string
  external_design_id?: string | null
  edit_url?: string | null
  view_url?: string | null
  error_message?: string | null
  created_at: string
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
  const [assets, setAssets] = useState<Asset[]>([])
  const [renders, setRenders] = useState<CreativeRender[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [templates, setTemplates] = useState<SocialTemplate[]>([])
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
    const [brandsRes, campaignsRes, contentRes, accountsRes, factsRes, assetsRes, rendersRes, queueRes, templatesRes] = await Promise.all([
      supabase.from('sm_brands').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_content').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('sm_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_brand_facts').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_brand_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('sm_template_renders').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('sm_queue').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('sm_templates').select('*').order('priority', { ascending: true }),
    ])
    const firstError = brandsRes.error || campaignsRes.error || contentRes.error || accountsRes.error || factsRes.error || assetsRes.error || rendersRes.error || queueRes.error || templatesRes.error
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
    setAssets((assetsRes.data ?? []) as Asset[])
    setRenders((rendersRes.data ?? []) as CreativeRender[])
    setQueue((queueRes.data ?? []) as QueueItem[])
    setTemplates((templatesRes.data ?? []) as SocialTemplate[])
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
  const filteredTemplates = useMemo(
    () => templates.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [templates, selectedBrandId],
  )
  const filteredFacts = useMemo(
    () => facts.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [facts, selectedBrandId],
  )
  const filteredAssets = useMemo(
    () => assets.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [assets, selectedBrandId],
  )
  const filteredRenders = useMemo(
    () => renders.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [renders, selectedBrandId],
  )
  const filteredQueue = useMemo(
    () => queue.filter((item) => !selectedBrandId || item.brand_id === selectedBrandId),
    [queue, selectedBrandId],
  )
  const templateById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
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
    const language = selectedBrand.languages[0] || 'en'
    const brandTemplates = templates.filter((template) => template.brand_id === selectedBrand.id)
    const rows = drafts.map((draft, index) => {
      const templatePlan = buildTemplatePlan(
        brandTemplates,
        draft,
        selectedBrand,
        language,
        audience,
        objective,
      )
      const primaryTemplate = templatePlan[0]
      return {
        brand_id: selectedBrand.id,
        campaign_id: campaignId,
        code: `${selectedBrand.code_prefix}-${base}-${index + 1}`,
        audience: audience || null,
        objective: objective || null,
        theme: topic,
        platform: draft.platform,
        format: draft.format,
        language,
        caption: draft.caption,
        cta: cta || null,
        url: selectedBrand.website || null,
        final_url: selectedBrand.website || null,
        art_text: draft.artText || null,
        alt_text: draft.altText || null,
        script: draft.script || null,
        sources: approvedFacts.map((fact) => ({ type: 'approved_fact', fact })),
        status: 'em_revisao',
        production_status: draft.format === 'video_curto'
          ? 'production_required'
          : primaryTemplate
            ? 'template_assigned'
            : 'draft',
        payload: { ...draft.payload, template_plan: templatePlan },
        timezone: selectedBrand.timezone || 'America/Chicago',
        validation: draft.platform === 'x' ? { thread_validated: true } : {},
        template_id: primaryTemplate?.template_id || null,
        template_status: primaryTemplate
          ? (primaryTemplate.capability === 'autofill' ? 'autofill_ready' : 'assigned')
          : 'unassigned',
        creative_provider: primaryTemplate?.provider || null,
      }
    })
    const { error: insertError } = await supabase.from('sm_content').insert(rows)
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice(`${rows.length} peças multicanal criadas e enviadas para revisão.`)
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function createFact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrandId) return
    const form = new FormData(event.currentTarget)
    const factText = String(form.get('fact_text') || '').trim()
    const category = String(form.get('fact_category') || 'geral').trim()
    const sourceName = String(form.get('fact_source_name') || '').trim()
    const sourceUrl = String(form.get('fact_source_url') || '').trim()
    if (!factText) return

    const { data: userData } = await supabase.auth.getUser()
    setBusy(true)
    const { error: insertError } = await supabase.from('sm_brand_facts').insert({
      brand_id: selectedBrandId,
      category: category || 'geral',
      fact_text: factText,
      status: 'draft',
      source_name: sourceName || null,
      source_url: sourceUrl || null,
      created_by: userData.user?.email || 'authenticated-user',
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice('Fato adicionado como rascunho.')
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function approveFact(fact: Fact) {
    const { data: userData } = await supabase.auth.getUser()
    setBusy(true)
    const { error: updateError } = await supabase
      .from('sm_brand_facts')
      .update({
        status: 'approved',
        verified_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: userData.user?.email || 'authenticated-user',
      })
      .eq('id', fact.id)
    setBusy(false)
    if (updateError) setError(updateError.message)
    else {
      setNotice('Fato aprovado e liberado para geração.')
      await loadAll()
    }
  }

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrandId) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('asset_name') || '').trim()
    const url = String(form.get('asset_url') || '').trim()
    const kind = String(form.get('asset_kind') || 'image').trim()
    if (!name || !url) return

    setBusy(true)
    const { error: insertError } = await supabase.from('sm_brand_assets').insert({
      brand_id: selectedBrandId,
      kind,
      name,
      url,
      approved: false,
      metadata: {},
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice('Asset adicionado à biblioteca.')
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function toggleAssetApproval(asset: Asset) {
    setBusy(true)
    const { error: updateError } = await supabase
      .from('sm_brand_assets')
      .update({ approved: !asset.approved })
      .eq('id', asset.id)
    setBusy(false)
    if (updateError) setError(updateError.message)
    else {
      setNotice(asset.approved ? 'Asset removido da lista aprovada.' : 'Asset aprovado para uso.')
      await loadAll()
    }
  }

  async function completeRender(render: CreativeRender) {
    const editUrl = window.prompt('URL de edição da cópia no Canva')
    if (!editUrl) return
    const viewUrl = window.prompt('URL pública/visualização (opcional)') || null
    setBusy(true)
    const { error: renderError } = await supabase
      .from('sm_template_renders')
      .update({
        status: 'ready',
        edit_url: editUrl,
        view_url: viewUrl,
        error_message: null,
      })
      .eq('id', render.id)
    const { error: contentError } = await supabase
      .from('sm_content')
      .update({
        production_status: 'creative_ready',
        template_status: 'ready',
        creative_provider: render.provider,
        creative_edit_url: editUrl,
        creative_view_url: viewUrl,
      })
      .eq('id', render.content_id)
    setBusy(false)
    if (renderError) setError(renderError.message)
    else if (contentError) setError(contentError.message)
    else {
      setNotice('Arte marcada como pronta e vinculada ao conteúdo.')
      await loadAll()
    }
  }

  async function registerTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBrandId) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('template_name') || '').trim()
    const designId = String(form.get('design_id') || '').trim()
    const pageNumber = Number(form.get('page_number') || 1)
    const format = String(form.get('template_format') || 'post_estatico').trim()
    const platform = String(form.get('template_platform') || 'instagram').trim()
    const language = String(form.get('template_language') || '').trim()
    const viewUrl = String(form.get('view_url') || '').trim()
    const editUrl = String(form.get('edit_url') || '').trim()
    if (!name || !designId || !pageNumber) return

    setBusy(true)
    const { error: insertError } = await supabase.from('sm_templates').insert({
      brand_id: selectedBrandId,
      name,
      provider: 'canva',
      source_type: 'design_page',
      source_design_id: designId,
      source_page_number: pageNumber,
      platforms: [platform],
      formats: [format],
      language_tags: language ? [language] : [],
      audience_tags: [],
      objective_tags: [],
      field_schema: {},
      selection_rules: { preserve_master: true },
      capability: 'copy_manual',
      priority: 100,
      status: 'active',
      source_view_url: viewUrl || null,
      source_edit_url: editUrl || null,
    })
    setBusy(false)
    if (insertError) setError(insertError.message)
    else {
      setNotice('Template cadastrado. O original será tratado como master e não será sobrescrito.')
      event.currentTarget.reset()
      await loadAll()
    }
  }

  async function prepareCreative(item: ContentItem) {
    if (!item.template_id) {
      setError('Nenhum template foi atribuído a este conteúdo.')
      return
    }
    const template = templateById.get(item.template_id)
    if (!template) {
      setError('Template atribuído não foi encontrado na biblioteca.')
      return
    }

    setBusy(true)
    const { data: userData } = await supabase.auth.getUser()
    const templatePlan = Array.isArray(item.payload.template_plan)
      ? item.payload.template_plan
      : []
    const { error: renderError } = await supabase.from('sm_template_renders').insert({
      brand_id: item.brand_id,
      content_id: item.id,
      template_id: item.template_id,
      provider: template.provider,
      status: template.capability === 'autofill' ? 'queued' : 'manual_edit_required',
      payload: {
        template_plan: templatePlan,
        preserve_master: true,
        source_design_id: template.source_design_id,
        source_page_number: template.source_page_number,
      },
      created_by: userData.user?.email || 'authenticated-user',
    })
    const { error: updateError } = await supabase
      .from('sm_content')
      .update({
        template_status: template.capability === 'autofill' ? 'render_queued' : 'manual_edit_required',
        production_status: template.capability === 'autofill' ? 'render_queued' : 'template_ready',
      })
      .eq('id', item.id)

    setBusy(false)
    if (renderError && !renderError.message.includes('duplicate')) {
      setError(renderError.message)
      return
    }
    if (updateError) {
      setError(updateError.message)
      return
    }

    setNotice(
      template.capability === 'autofill'
        ? 'Render Canva enfileirado.'
        : 'Template preparado. Como este master ainda não possui campos Autofill, o OS preserva o original e deixa a arte pronta para cópia/edição no Canva.',
    )
    await loadAll()
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

  async function enqueueItem(item: ContentItem) {
    const compatible = filteredAccounts.filter(
      (account) => account.platform === item.platform && account.status === 'conectada' && !account.paused,
    )
    if (!compatible.length) {
      setError('Nenhuma conta conectada para esta plataforma. Conecte/mapeie a conta antes de enviar para publicação.')
      return
    }
    const account = compatible.length === 1
      ? compatible[0]
      : compatible.find((candidate) => window.confirm(`Usar @${candidate.handle} (${candidate.provider || 'buffer'})?`))
    if (!account) return

    setBusy(true)
    const { data, error: rpcError } = await supabase.rpc('sm_enqueue_content', {
      p_content_id: item.id,
      p_account_id: account.id,
      p_due_at: item.scheduled_for || new Date().toISOString(),
    })
    setBusy(false)
    if (rpcError) setError(rpcError.message)
    else {
      setNotice(`Publicação adicionada à fila com segurança: ${String(data).slice(0, 8)}…`)
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
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
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
            ['Falhas', stats.failed, AlertCircle],
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
              Usa configuração da marca, fatos aprovados e escolhe automaticamente um layout compatível da biblioteca.
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

        <div className="grid gap-6 xl:grid-cols-2">
          <section className={panel}>
            <h2 className="text-lg font-bold">Brand Knowledge</h2>
            <p className="mt-1 text-xs text-gray-500">Somente fatos aprovados entram como verdade comercial na geração.</p>
            <form onSubmit={createFact} className="mt-4 space-y-3">
              <textarea className={input} name="fact_text" placeholder="Fato confirmado sobre a marca" rows={3} required />
              <div className="grid gap-3 md:grid-cols-2">
                <input className={input} name="fact_category" placeholder="Categoria (preço, produto, política...)" />
                <input className={input} name="fact_source_name" placeholder="Fonte" />
              </div>
              <input className={input} name="fact_source_url" placeholder="URL da fonte (opcional)" />
              <button disabled={busy || !selectedBrand} className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Adicionar fato
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {filteredFacts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Nenhum fato cadastrado.</div>
              ) : filteredFacts.slice(0, 10).map((fact) => (
                <div key={fact.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{fact.fact_text}</p>
                      <p className="mt-1 text-xs text-gray-500">{fact.category} · {fact.status}</p>
                    </div>
                    {fact.status !== 'approved' && (
                      <button onClick={() => void approveFact(fact)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                        Aprovar
                      </button>
                    )}
                  </div>
                  {fact.source_url && (
                    <a href={fact.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                      Ver fonte <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={panel}>
            <h2 className="text-lg font-bold">Brand Assets</h2>
            <p className="mt-1 text-xs text-gray-500">Logos, imagens, vídeos, templates e referências aprovadas por marca.</p>
            <form onSubmit={createAsset} className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input className={input} name="asset_name" placeholder="Nome do asset" required />
                <select className={input} name="asset_kind" defaultValue="image">
                  <option value="logo">Logo</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                  <option value="template">Template</option>
                  <option value="font">Fonte</option>
                  <option value="reference">Referência</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <input className={input} name="asset_url" placeholder="URL do arquivo" required />
              <button disabled={busy || !selectedBrand} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Adicionar asset
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {filteredAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Nenhum asset cadastrado.</div>
              ) : filteredAssets.slice(0, 10).map((asset) => (
                <div key={asset.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <a href={asset.url} target="_blank" rel="noreferrer" className="truncate text-sm font-semibold text-blue-700 hover:underline">{asset.name}</a>
                    <p className="text-xs text-gray-500">{asset.kind} · {asset.approved ? 'aprovado' : 'pendente'}</p>
                  </div>
                  <button onClick={() => void toggleAssetApproval(asset)} className="rounded-lg border px-3 py-2 text-xs font-semibold">
                    {asset.approved ? 'Desaprovar' : 'Aprovar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className={panel}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold">Biblioteca de templates</h2>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                O motor escolhe automaticamente por plataforma, formato, proporção, idioma, público e objetivo.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {filteredTemplates.filter((template) => template.status === 'active').length} ativos
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.slice(0, 12).map((template) => (
              <div key={template.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {template.aspect_ratio || 'custom'} · {template.platforms.join(', ') || 'reference'}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium">
                    {template.capability === 'autofill' ? 'Autofill' : 'Copy/Edit'}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {template.source_page_number ? `Página ${template.source_page_number}` : 'Brand Template'} · {template.formats.join(', ') || 'referência'}
                </p>
                {template.source_view_url && (
                  <a
                    href={template.source_view_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Abrir master no Canva <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>

          <details className="mt-5 border-t pt-4">
            <summary className="cursor-pointer text-sm font-semibold">Adicionar outro template Canva</summary>
            <form onSubmit={registerTemplate} className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input className={input} name="template_name" placeholder="Nome do template" required />
              <input className={input} name="design_id" placeholder="Canva Design ID" required />
              <input className={input} name="page_number" type="number" min="1" defaultValue="1" required />
              <select className={input} name="template_platform" defaultValue="instagram">
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="x">X</option>
                <option value="tiktok">TikTok</option>
              </select>
              <select className={input} name="template_format" defaultValue="post_estatico">
                <option value="post_estatico">Post estático</option>
                <option value="carrossel">Carrossel</option>
                <option value="story">Story</option>
                <option value="video_curto">Vídeo curto</option>
              </select>
              <input className={input} name="template_language" placeholder="Idioma (en, pt...)" />
              <input className={input} name="view_url" placeholder="Canva view URL" />
              <input className={input} name="edit_url" placeholder="Canva edit URL" />
              <button
                disabled={busy || !selectedBrand}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2 lg:col-span-4"
              >
                Cadastrar template
              </button>
            </form>
          </details>
        </section>

        <section className={panel}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">Contas e fila de publicação</h2>
              <p className="mt-1 text-xs text-gray-500">Provider-agnostic, com idempotência, tentativas e confirmação externa.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{filteredQueue.length} jobs</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Contas da marca</p>
              {filteredAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Nenhuma conta social mapeada.</div>
              ) : filteredAccounts.map((account) => (
                <div key={account.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div><b>{account.platform}</b> · @{account.handle}</div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px]">{account.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Provider: {account.provider || 'buffer'} · {account.provider_channel_id || account.buffer_channel_id || 'canal não mapeado'}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Fila</p>
              {filteredQueue.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">Fila vazia.</div>
              ) : filteredQueue.slice(0, 12).map((job) => {
                const item = content.find((candidate) => candidate.id === job.content_id)
                return (
                  <div key={job.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item?.theme || item?.code || job.content_id}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px]">{job.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{new Date(job.due_at).toLocaleString()} · tentativa {job.attempts}/{job.max_attempts}</p>
                    {job.external_url && <a href={job.external_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">Ver publicação <ExternalLink size={12}/></a>}
                    {job.last_error && <p className="mt-2 text-xs text-red-600">{job.last_error}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Creative Queue</h2>
              <p className="mt-1 text-xs text-gray-500">Acompanhe artes preparadas e vincule a cópia final do Canva sem tocar no master.</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{filteredRenders.length} jobs</span>
          </div>
          <div className="mt-4 space-y-2">
            {filteredRenders.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-gray-500">Nenhuma arte em preparação.</div>
            ) : filteredRenders.slice(0, 12).map((render) => {
              const item = content.find((candidate) => candidate.id === render.content_id)
              const template = templateById.get(render.template_id)
              return (
                <div key={render.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-violet-50 px-2 py-1 font-semibold text-violet-700">{render.status}</span>
                        <span className="text-gray-500">{render.provider}</span>
                      </div>
                      <p className="mt-2 font-semibold">{item?.theme || item?.code || render.content_id}</p>
                      <p className="mt-1 text-xs text-gray-500">{template?.name || 'Template'} · {new Date(render.created_at).toLocaleString()}</p>
                      {render.error_message && <p className="mt-2 text-xs text-red-600">{render.error_message}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {render.edit_url && (
                        <a href={render.edit_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold">
                          Abrir arte <ExternalLink size={13} />
                        </a>
                      )}
                      {render.status !== 'ready' && (
                        <button onClick={() => void completeRender(render)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">
                          Marcar pronta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

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
                      {item.template_id && templateById.get(item.template_id) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-violet-50 px-2 py-1 font-medium text-violet-700">
                            Template: {templateById.get(item.template_id)?.name}
                          </span>
                          <span className="text-gray-400">{item.template_status || 'assigned'}</span>
                        </div>
                      )}
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.caption || 'Sem legenda'}</p>
                      {item.scheduled_for && <p className="mt-2 text-xs text-gray-500">Agendado: {new Date(item.scheduled_for).toLocaleString()}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.template_id && (
                        <button
                          onClick={() => void prepareCreative(item)}
                          className="flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700"
                        >
                          <Layers size={14} /> Preparar arte
                        </button>
                      )}
                      {item.status === 'em_revisao' && (
                        <>
                          <button onClick={() => void updateStatus(item, 'aprovado')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Aprovar</button>
                          <button onClick={() => void updateStatus(item, 'cancelado')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Rejeitar</button>
                        </>
                      )}
                      {item.status === 'aprovado' && (
                        <button onClick={() => void scheduleItem(item)}
                      {(item.status === 'aprovado' || item.status === 'agendado') && (
                        <button onClick={() => void enqueueItem(item)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>
                          Enviar à fila
                        </button>
                      )} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
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
              <div className="flex justify-between"><span>Seleção automática de templates</span><b className="text-emerald-700">Ativa</b></div>
              <div className="flex justify-between"><span>Canva master library</span><b className="text-emerald-700">{filteredTemplates.length ? 'Conectada' : 'Sem templates'}</b></div>
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
