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

const clean = (value: string) => value.trim().replace(/\s+/g, ' ')
const clip = (value: string, max: number) => (value.length <= max ? value : value.slice(0, max - 1).trimEnd() + '…')

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
  const linkedin = [
    `${topic}: uma forma prática de pensar sobre isso.`,
    '',
    `Para ${audience}, o ponto principal é transformar informação em uma próxima ação clara. O conteúdo deve refletir um tom ${voice}, sem promessas que não possam ser verificadas.`,
    '',
    `Objetivo desta peça: ${objective}. ${factLine}`,
    '',
    `Em vez de repetir a mesma mensagem em todos os canais, esta versão prioriza contexto e utilidade para uma audiência profissional.`,
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
      payload: { audience, objective, cta, destination, factual_basis: factLine },
    },
    {
      platform: 'instagram',
      format: 'carrossel',
      caption: clip(`${topic}. Conteúdo criado para ${audience}, com foco em ${objective}. ${cta}.`, 600),
      altText: `Carrossel educativo sobre ${topic}.`,
      payload: { slides, audience, objective, cta, destination },
    },
    {
      platform: 'instagram',
      format: 'video_curto',
      caption: clip(`${topic}: versão para Reels. ${cta}.`, 600),
      script: reelScript,
      payload: { hooks, selected_hook: hooks[2], duration_seconds: 30, channel: 'reels' },
    },
    {
      platform: 'tiktok',
      format: 'video_curto',
      caption: clip(`${topic}. ${cta}.`, 600),
      script: reelScript,
      payload: { hooks, selected_hook: hooks[2], duration_seconds: 30, channel: 'tiktok' },
    },
    {
      platform: 'x',
      format: 'texto',
      caption: thread.join('\n\n'),
      payload: { thread, character_counts: thread.map((post) => post.length) },
    },
    {
      platform: 'facebook',
      format: 'texto',
      caption: facebook,
      payload: { audience, objective, cta, destination },
    },
  ]
}
