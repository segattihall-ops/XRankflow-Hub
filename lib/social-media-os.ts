export type Brand = {
  id: string
  name: string
  slug: string
  code_prefix: string
  status: string
  description?: string | null
  positioning?: string | null
  audiences: unknown[]
  voice?: string | null
  languages: string[]
  website?: string | null
  niche?: string | null
  regions: string[]
  timezone: string
  monthly_budget_limit?: number | null
  forbidden_words: string[]
  content_pillars: unknown[]
  objectives: unknown[]
  approval_mode: string
  paused: boolean
}

export type TemplateField = {
  type: 'text' | 'image' | 'video' | 'chart'
  max_chars?: number
}

export type SocialTemplate = {
  id: string
  brand_id: string
  name: string
  provider: 'canva' | 'internal' | 'other'
  source_type: 'design_page' | 'brand_template'
  source_design_id?: string | null
  source_page_number?: number | null
  source_brand_template_id?: string | null
  platforms: string[]
  formats: string[]
  width?: number | null
  height?: number | null
  aspect_ratio?: string | null
  language_tags: string[]
  audience_tags: string[]
  objective_tags: string[]
  field_schema: Record<string, TemplateField>
  selection_rules: Record<string, unknown>
  capability: 'copy_manual' | 'autofill'
  priority: number
  status: 'active' | 'paused' | 'reference' | 'archived'
  source_edit_url?: string | null
  source_view_url?: string | null
}

export type ContentItem = {
  id: string
  brand_id: string
  campaign_id?: string | null
  code: string
  audience?: string | null
  pillar?: string | null
  objective?: string | null
  theme?: string | null
  platform: string
  format: string
  language: string
  caption?: string | null
  cta?: string | null
  final_url?: string | null
  status: string
  production_status: string
  scheduled_for?: string | null
  timezone: string
  version: number
  payload: Record<string, unknown>
  template_id?: string | null
  template_status?: string | null
  creative_provider?: string | null
  creative_design_id?: string | null
  creative_edit_url?: string | null
  creative_view_url?: string | null
}

type PackInput = {
  brand: Brand
  topic: string
  audience: string
  objective: string
  cta: string
  destinationUrl?: string
  language?: string
  approvedFacts?: string[]
}

export type GeneratedDraft = {
  platform: 'linkedin' | 'instagram' | 'tiktok' | 'x' | 'facebook'
  format: 'texto' | 'carrossel' | 'video_curto'
  caption: string
  script?: string
  artText?: string
  altText?: string
  payload: Record<string, unknown>
}

export type TemplatePlanItem = {
  slide?: number
  template_id: string
  template_name: string
  provider: SocialTemplate['provider']
  capability: SocialTemplate['capability']
  source_design_id?: string | null
  source_page_number?: number | null
  source_brand_template_id?: string | null
  source_view_url?: string | null
  aspect_ratio?: string | null
  fields: Record<string, string>
  requires_image: boolean
}

const clean = (value: string) => value.trim().replace(/\s+/g, ' ')
const clip = (value: string, max: number) => (value.length <= max ? value : value.slice(0, Math.max(1, max - 1)).trimEnd() + '…')
const norm = (value: string) => clean(value).toLocaleLowerCase()

function tagMatches(tags: string[], value: string) {
  if (!tags.length || !value.trim()) return true
  const target = norm(value)
  return tags.some((tag) => {
    const candidate = norm(tag)
    return candidate === target || target.includes(candidate) || candidate.includes(target)
  })
}

function desiredCreativeFormat(format: GeneratedDraft['format']) {
  if (format === 'texto') return 'post_estatico'
  return format
}

function desiredAspectRatio(platform: GeneratedDraft['platform'], format: GeneratedDraft['format']) {
  if (format === 'video_curto' || platform === 'tiktok') return '9:16'
  if (platform === 'instagram' && format === 'carrossel') return '4:5'
  return '1:1'
}

function scoreTemplate(
  template: SocialTemplate,
  platform: GeneratedDraft['platform'],
  format: GeneratedDraft['format'],
  language: string,
  audience: string,
  objective: string,
) {
  if (template.status !== 'active') return Number.NEGATIVE_INFINITY
  if (!template.platforms.includes(platform)) return Number.NEGATIVE_INFINITY

  const creativeFormat = desiredCreativeFormat(format)
  const formatOk = template.formats.includes(creativeFormat)
    || (format === 'video_curto' && template.formats.includes('story'))
  if (!formatOk) return Number.NEGATIVE_INFINITY

  if (template.language_tags.length && !template.language_tags.includes(language)) {
    return Number.NEGATIVE_INFINITY
  }

  let score = 10000 - (template.priority * 10)
  if (template.aspect_ratio === desiredAspectRatio(platform, format)) score += 500
  if (template.language_tags.includes(language)) score += 200
  if (template.audience_tags.length && tagMatches(template.audience_tags, audience)) score += 120
  if (template.objective_tags.length && tagMatches(template.objective_tags, objective)) score += 120
  if (template.capability === 'autofill') score += 50
  return score
}

export function selectTemplatesForDraft(
  templates: SocialTemplate[],
  draft: GeneratedDraft,
  language: string,
  audience: string,
  objective: string,
): SocialTemplate[] {
  const ranked = templates
    .map((template) => ({
      template,
      score: scoreTemplate(template, draft.platform, draft.format, language, audience, objective),
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score || a.template.priority - b.template.priority)

  if (draft.format !== 'carrossel') {
    return ranked.slice(0, 1).map(({ template }) => template)
  }

  const slides = Array.isArray(draft.payload.slides) ? draft.payload.slides.length : 7
  const seen = new Set<string>()
  const selected: SocialTemplate[] = []

  for (const { template } of ranked) {
    const key = `${template.source_design_id || template.source_brand_template_id || template.id}:${template.source_page_number || 0}`
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(template)
    if (selected.length >= slides) break
  }

  if (selected.length && selected.length < slides) {
    let index = 0
    while (selected.length < slides) {
      selected.push(selected[index % selected.length])
      index += 1
    }
  }

  return selected
}

function applyFieldLimits(
  schema: Record<string, TemplateField>,
  values: Record<string, string>,
) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([key, value]) => Boolean(value) && schema[key]?.type === 'text')
      .map(([key, value]) => {
        const max = schema[key]?.max_chars
        return [key, max ? clip(value, max) : value]
      }),
  )
}

function templateFieldsForDraft(
  template: SocialTemplate,
  draft: GeneratedDraft,
  brand: Brand,
  slide?: { title?: string; text?: string },
  isLastSlide = false,
) {
  const topic = String(draft.payload.topic || '')
  const objective = String(draft.payload.objective || '')
  const cta = String(draft.payload.cta || '')
  const baseValues: Record<string, string> = {
    title: slide?.title || topic,
    subtitle: slide?.text || objective,
    body: slide?.text || draft.caption,
    cta: isLastSlide ? cta : '',
    signature: brand.name,
  }
  return applyFieldLimits(template.field_schema, baseValues)
}

export function buildTemplatePlan(
  templates: SocialTemplate[],
  draft: GeneratedDraft,
  brand: Brand,
  language: string,
  audience: string,
  objective: string,
): TemplatePlanItem[] {
  const selected = selectTemplatesForDraft(templates, draft, language, audience, objective)
  if (!selected.length) return []

  const slides = Array.isArray(draft.payload.slides)
    ? (draft.payload.slides as Array<{ title?: string; text?: string }>)
    : []

  return selected.map((template, index) => {
    const slide = slides[index]
    const fields = templateFieldsForDraft(template, draft, brand, slide, index === slides.length - 1)
    const needsImage = Object.values(template.field_schema).some((field) => field.type === 'image')
    return {
      ...(draft.format === 'carrossel' ? { slide: index + 1 } : {}),
      template_id: template.id,
      template_name: template.name,
      provider: template.provider,
      capability: template.capability,
      source_design_id: template.source_design_id,
      source_page_number: template.source_page_number,
      source_brand_template_id: template.source_brand_template_id,
      source_view_url: template.source_view_url,
      aspect_ratio: template.aspect_ratio,
      fields,
      requires_image: needsImage,
    }
  })
}

export function buildMultichannelPack(input: PackInput): GeneratedDraft[] {
  const topic = clean(input.topic)
  const audience = clean(input.audience || 'público principal')
  const objective = clean(input.objective || 'informar')
  const cta = clean(input.cta || 'Saiba mais')
  const voice = clean(input.brand.voice || 'claro, útil e direto')
  const factLine = input.approvedFacts?.length
    ? `Fatos aprovados disponíveis: ${input.approvedFacts.slice(0, 3).join(' | ')}`
    : 'Sem alegações factuais adicionais.'
  const destination = input.destinationUrl || input.brand.website || ''
  const commonPayload = { topic, audience, objective, cta, destination, factual_basis: factLine }
  const linkedin = [
    `${topic}: uma forma prática de pensar sobre isso.`,
    '',
    `Para ${audience}, o ponto principal é transformar informação em uma próxima ação clara. O conteúdo deve refletir um tom ${voice}, sem promessas que não possam ser verificadas.`,
    '',
    `Objetivo desta peça: ${objective}. ${factLine}`,
    '',
    'Em vez de repetir a mesma mensagem em todos os canais, esta versão prioriza contexto e utilidade para uma audiência profissional.',
    '',
    destination ? `${cta}: ${destination}` : cta,
  ].join('\n')

  const slides = [
    { title: clip(topic, 52), text: 'O essencial, sem enrolação.' },
    { title: 'Por que isso importa', text: clip(`Relevância direta para ${audience}.`, 90) },
    { title: 'O que considerar', text: clip('Separe fatos confirmados de hipóteses e opinião.', 90) },
    { title: 'Evite o erro comum', text: clip('Não copie a mesma mensagem entre plataformas.', 90) },
    { title: 'Adapte ao contexto', text: clip(`Mantenha um tom ${voice} e preserve a identidade da marca.`, 90) },
    { title: 'Próxima ação', text: clip(`Conecte o tema ao objetivo: ${objective}.`, 90) },
    { title: 'Resumo', text: clip(cta, 90) },
  ]

  const hooks = [
    `Nem todo conteúdo sobre ${topic} precisa parecer publicidade.`,
    `Uma peça sobre ${topic} pode ser simples e ainda levar a uma ação clara.`,
    `O que muda quando ${topic} é adaptado ao canal certo?`,
  ]
  const reelScript = [
    '0–3s — Hook: ' + hooks[2],
    `3–10s — Contexto: explique por que o tema interessa a ${audience}.`,
    '10–20s — Valor: apresente 2 pontos concretos, usando somente fatos aprovados.',
    `20–27s — Aplicação: conecte ao objetivo ${objective}.`,
    `27–30s — CTA: ${cta}.`,
  ].join('\n')

  const thread = [
    clip(`${topic}: comece pelo que é realmente útil para ${audience}. Evite copiar a mesma legenda de outras redes.`, 279),
    clip(`2/3 Separe fatos confirmados de hipóteses. Adapte formato, ritmo e CTA ao canal. Objetivo desta peça: ${objective}.`, 279),
    clip(`3/3 Próxima ação: ${cta}${destination ? ` — ${destination}` : ''}`, 279),
  ]

  const facebook = [
    `Vamos falar de ${topic} de forma simples.`,
    '',
    `Para ${audience}, quais dúvidas ainda ficam abertas quando esse assunto aparece?`,
    '',
    `A ideia aqui é ${objective}, usando apenas informações confirmadas e uma linguagem ${voice}.`,
    '',
    destination ? `${cta}: ${destination}` : cta,
  ].join('\n')

  return [
    {
      platform: 'linkedin',
      format: 'texto',
      caption: linkedin,
      payload: commonPayload,
    },
    {
      platform: 'instagram',
      format: 'carrossel',
      caption: clip(`${topic}. Conteúdo criado para ${audience}, com foco em ${objective}. ${cta}.`, 600),
      altText: `Carrossel educativo sobre ${topic}.`,
      payload: { ...commonPayload, slides },
    },
    {
      platform: 'instagram',
      format: 'video_curto',
      caption: clip(`${topic}: versão para Reels. ${cta}.`, 600),
      script: reelScript,
      payload: { ...commonPayload, hooks, selected_hook: hooks[2], duration_seconds: 30, channel: 'reels' },
    },
    {
      platform: 'tiktok',
      format: 'video_curto',
      caption: clip(`${topic}. ${cta}.`, 600),
      script: reelScript,
      payload: { ...commonPayload, hooks, selected_hook: hooks[2], duration_seconds: 30, channel: 'tiktok' },
    },
    {
      platform: 'x',
      format: 'texto',
      caption: thread.join('\n\n'),
      payload: { ...commonPayload, thread, character_counts: thread.map((post) => post.length) },
    },
    {
      platform: 'facebook',
      format: 'texto',
      caption: facebook,
      payload: commonPayload,
    },
  ]
}
