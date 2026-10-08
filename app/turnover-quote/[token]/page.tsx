'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, Bath, BedDouble, Camera, Check, CheckCircle2, ClipboardCheck,
  DollarSign, ExternalLink, Home, Languages, Loader2, MessageSquare,
  RefreshCw, ShieldCheck, Sparkles, Trash2
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Language = 'en' | 'pt' | 'es'

type PublicRequest = {
  id: string
  property_name: string
  property_address: string | null
  airbnb_url: string | null
  bedrooms: number | null
  bathrooms: number | null
  turnover_date: string | null
  turnover_notes: string | null
  photo_urls: string[]
  status: string
}

const field = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5'
const label = 'mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-500'

const copy = {
  en: {
    language: 'Language',
    header: 'Cleaning Partner Opportunity',
    headerSub: 'Airbnb turnover quote portal',
    badge: 'NOW ACCEPTING QUOTES',
    heroTitle: 'Submit your quote to become our Airbnb turnover cleaning partner.',
    heroBody: 'Review the property, service standards and all-inclusive pricing requirements below. If selected, future turnovers can be managed through the same operations portal.',
    loading: 'Loading quote request…',
    unavailableTitle: 'Quote request unavailable',
    unavailable: 'This quote request is unavailable.',
    unavailableClosed: 'This quote request is unavailable or bidding has closed.',
    property: 'PROPERTY',
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    nextTurnover: 'Next turnover',
    viewListing: 'View Airbnb listing',
    gallery: 'Property photos',
    scopeTitle: 'What the turnover includes',
    scopeIntro: 'Your quote should cover a complete guest-ready reset of the property after checkout.',
    scopeItems: [
      'Full cleaning of bedrooms, bathrooms and common areas',
      'Kitchen cleaning, counters, sink and appliance surfaces',
      'Floors vacuumed/mopped and visible dust removed',
      'Trash collected and removed from the property',
      'Laundry completed and linens/towels reset for the next guest',
      'Beds reset and guest-ready presentation restored',
      'Paper towels and toilet paper restocked',
      'Cleaning supplies and materials included in your price',
      'Report damage, missing items or unusual conditions',
      'Final completion photos when requested',
    ],
    standardTitle: 'Service standard',
    standardBody: 'The property must be left clean, organized, stocked and ready for the next guest. If something prevents completion, report it immediately instead of marking the turnover complete.',
    pricingEyebrow: 'ALL-INCLUSIVE PRICING',
    pricingTitle: 'One total price. No surprise add-ons.',
    pricingBody: 'Your submitted amount must already include the required operating costs below. Do not submit a base cleaning price and add these charges later.',
    materials: 'Cleaning supplies & materials',
    laundry: 'Laundry',
    paperTowels: 'Paper towels',
    toiletPaper: 'Toilet paper',
    processTitle: 'How the selection works',
    process: [
      ['Review', 'Review the property, photos and turnover expectations.'],
      ['Quote', 'Submit your complete all-inclusive price and availability.'],
      ['Selection', 'We compare quotes and select the cleaning partner.'],
      ['Operations', 'If selected, future turnovers, follow-ups and payment tracking are managed through XRankFlow.'],
    ],
    scope: 'Property notes',
    defaultScope: 'Standard Airbnb turnover cleaning. Review the property photos and submit your complete all-inclusive price.',
    formEyebrow: 'CLEANING COMPANY QUOTE',
    formTitle: 'Submit your quote',
    formSub: 'Complete the form below. You can submit from your phone in a few minutes.',
    company: 'Company / cleaner name',
    contact: 'Contact name',
    email: 'Email',
    phone: 'Phone',
    total: 'All-inclusive price per turnover',
    confirm: 'I confirm my price includes everything listed',
    hours: 'Estimated hours',
    team: 'Team size',
    availability: 'Availability',
    availabilityPlaceholder: 'Days/times you are generally available for turnovers',
    notes: 'Additional notes',
    notesPlaceholder: 'Experience, scheduling limitations, special services, or anything else we should know',
    submit: 'Submit quote',
    submitReady: 'Ready to submit',
    confirmHelp: 'Confirm the all-inclusive price to submit.',
    contactHelp: 'Provide at least an email or phone number.',
    privacy: 'Your quote is private. Other cleaning companies cannot see your submitted price.',
    errorAll: 'The total price must include all required items before you can submit.',
    errorContact: 'Please provide an email or phone number.',
    errorSubmit: 'We could not submit the quote. Please review the total price, contact information and included items.',
    sentTitle: 'Quote received',
    sentBody: 'Thank you. Your quote was submitted successfully and will be reviewed.',
    sentNext: 'If your company is selected, we will use your contact information for the next step.',
  },
  pt: {
    language: 'Idioma',
    header: 'Oportunidade para Empresa de Limpeza',
    headerSub: 'Portal de orçamento para turnover de Airbnb',
    badge: 'RECEBENDO ORÇAMENTOS',
    heroTitle: 'Envie seu orçamento para se tornar nosso parceiro de limpeza de turnover do Airbnb.',
    heroBody: 'Revise o imóvel, o padrão do serviço e os requisitos de preço completo abaixo. Se selecionado, os próximos turnovers poderão ser administrados pelo mesmo portal operacional.',
    loading: 'Carregando solicitação…',
    unavailableTitle: 'Solicitação indisponível',
    unavailable: 'Esta solicitação de orçamento não está disponível.',
    unavailableClosed: 'Esta solicitação não está disponível ou o período de orçamentos foi encerrado.',
    property: 'IMÓVEL',
    bedrooms: 'quartos',
    bathrooms: 'banheiros',
    nextTurnover: 'Próximo turnover',
    viewListing: 'Ver anúncio no Airbnb',
    gallery: 'Fotos do imóvel',
    scopeTitle: 'O que o turnover inclui',
    scopeIntro: 'Seu orçamento deve cobrir a preparação completa do imóvel para o próximo hóspede após o checkout.',
    scopeItems: [
      'Limpeza completa dos quartos, banheiros e áreas comuns',
      'Limpeza da cozinha, bancadas, pia e superfícies dos eletrodomésticos',
      'Aspirar/passar pano nos pisos e remover poeira visível',
      'Recolher e retirar o lixo do imóvel',
      'Fazer laundry e preparar roupas de cama/toalhas para o próximo hóspede',
      'Arrumar as camas e restaurar a apresentação do imóvel',
      'Repor papel-toalha e papel higiênico',
      'Incluir produtos e materiais de limpeza no preço',
      'Reportar danos, itens faltando ou situações fora do normal',
      'Enviar fotos finais quando solicitado',
    ],
    standardTitle: 'Padrão do serviço',
    standardBody: 'O imóvel deve ficar limpo, organizado, abastecido e pronto para o próximo hóspede. Se algo impedir a conclusão, deve ser reportado imediatamente em vez de marcar o turnover como concluído.',
    pricingEyebrow: 'PREÇO COMPLETO',
    pricingTitle: 'Um preço total. Sem cobranças surpresa.',
    pricingBody: 'O valor enviado deve incluir todos os custos operacionais obrigatórios abaixo. Não envie um preço básico para acrescentar cobranças depois.',
    materials: 'Produtos e materiais de limpeza',
    laundry: 'Lavanderia',
    paperTowels: 'Papel-toalha',
    toiletPaper: 'Papel higiênico',
    processTitle: 'Como funciona a seleção',
    process: [
      ['Revisão', 'Revise o imóvel, as fotos e as expectativas do turnover.'],
      ['Orçamento', 'Envie seu preço completo e sua disponibilidade.'],
      ['Seleção', 'Nós comparamos as propostas e escolhemos o parceiro de limpeza.'],
      ['Operação', 'Se selecionado, turnovers futuros, follow-ups e pagamentos serão acompanhados pelo XRankFlow.'],
    ],
    scope: 'Observações do imóvel',
    defaultScope: 'Limpeza padrão de turnover para Airbnb. Revise as fotos e envie seu preço completo com tudo incluído.',
    formEyebrow: 'ORÇAMENTO DA EMPRESA DE LIMPEZA',
    formTitle: 'Enviar orçamento',
    formSub: 'Preencha o formulário abaixo. Você pode enviar pelo celular em poucos minutos.',
    company: 'Empresa / cleaner',
    contact: 'Nome do contato',
    email: 'Email',
    phone: 'Telefone',
    total: 'Preço completo por turnover',
    confirm: 'Confirmo que meu preço inclui todos os itens',
    hours: 'Horas estimadas',
    team: 'Tamanho da equipe',
    availability: 'Disponibilidade',
    availabilityPlaceholder: 'Dias/horários em que você normalmente pode realizar turnovers',
    notes: 'Observações adicionais',
    notesPlaceholder: 'Experiência, limitações de agenda, serviços especiais ou algo que devemos saber',
    submit: 'Enviar orçamento',
    submitReady: 'Pronto para enviar',
    confirmHelp: 'Confirme o preço completo para enviar.',
    contactHelp: 'Informe pelo menos um email ou telefone.',
    privacy: 'Seu orçamento é privado. Outras empresas de limpeza não conseguem ver o preço enviado.',
    errorAll: 'O preço total deve incluir todos os itens obrigatórios antes do envio.',
    errorContact: 'Informe um email ou telefone.',
    errorSubmit: 'Não foi possível enviar o orçamento. Revise o preço total, contato e itens incluídos.',
    sentTitle: 'Orçamento recebido',
    sentBody: 'Obrigado. Seu orçamento foi enviado com sucesso e será analisado.',
    sentNext: 'Se sua empresa for selecionada, usaremos seus dados de contato para o próximo passo.',
  },
  es: {
    language: 'Idioma',
    header: 'Oportunidad para Empresa de Limpieza',
    headerSub: 'Portal de cotización para turnover de Airbnb',
    badge: 'RECIBIENDO COTIZACIONES',
    heroTitle: 'Envíe su cotización para convertirse en nuestro socio de limpieza de turnover de Airbnb.',
    heroBody: 'Revise la propiedad, los estándares del servicio y los requisitos de precio completo. Si es seleccionado, los próximos turnovers podrán gestionarse desde el mismo portal operativo.',
    loading: 'Cargando solicitud…',
    unavailableTitle: 'Solicitud no disponible',
    unavailable: 'Esta solicitud de cotización no está disponible.',
    unavailableClosed: 'Esta solicitud no está disponible o la recepción de cotizaciones ya cerró.',
    property: 'PROPIEDAD',
    bedrooms: 'habitaciones',
    bathrooms: 'baños',
    nextTurnover: 'Próximo turnover',
    viewListing: 'Ver anuncio en Airbnb',
    gallery: 'Fotos de la propiedad',
    scopeTitle: 'Qué incluye el turnover',
    scopeIntro: 'Su cotización debe cubrir la preparación completa de la propiedad para el próximo huésped después del checkout.',
    scopeItems: [
      'Limpieza completa de habitaciones, baños y áreas comunes',
      'Limpieza de cocina, encimeras, fregadero y superficies de electrodomésticos',
      'Aspirar/fregar pisos y retirar polvo visible',
      'Recoger y retirar la basura de la propiedad',
      'Completar lavandería y preparar ropa de cama/toallas para el próximo huésped',
      'Preparar camas y restaurar la presentación de la propiedad',
      'Reponer toallas de papel y papel higiénico',
      'Incluir productos y materiales de limpieza en el precio',
      'Reportar daños, artículos faltantes o condiciones inusuales',
      'Enviar fotos finales cuando se solicite',
    ],
    standardTitle: 'Estándar del servicio',
    standardBody: 'La propiedad debe quedar limpia, organizada, abastecida y lista para el próximo huésped. Si algo impide completar el trabajo, debe reportarse inmediatamente.',
    pricingEyebrow: 'PRECIO TODO INCLUIDO',
    pricingTitle: 'Un precio total. Sin cargos sorpresa.',
    pricingBody: 'El monto enviado debe incluir todos los costos obligatorios de abajo. No envíe un precio básico para agregar cargos después.',
    materials: 'Productos y materiales de limpieza',
    laundry: 'Lavandería',
    paperTowels: 'Toallas de papel',
    toiletPaper: 'Papel higiénico',
    processTitle: 'Cómo funciona la selección',
    process: [
      ['Revisión', 'Revise la propiedad, las fotos y las expectativas del turnover.'],
      ['Cotización', 'Envíe su precio completo y disponibilidad.'],
      ['Selección', 'Comparamos las propuestas y elegimos al socio de limpieza.'],
      ['Operación', 'Si es seleccionado, los turnovers futuros, seguimientos y pagos se gestionan en XRankFlow.'],
    ],
    scope: 'Notas de la propiedad',
    defaultScope: 'Limpieza estándar de turnover para Airbnb. Revise las fotos y envíe su precio completo con todo incluido.',
    formEyebrow: 'COTIZACIÓN DE LA EMPRESA DE LIMPIEZA',
    formTitle: 'Enviar cotización',
    formSub: 'Complete el formulario. Puede enviarlo desde su teléfono en pocos minutos.',
    company: 'Empresa / cleaner',
    contact: 'Nombre de contacto',
    email: 'Email',
    phone: 'Teléfono',
    total: 'Precio completo por turnover',
    confirm: 'Confirmo que mi precio incluye todos los artículos',
    hours: 'Horas estimadas',
    team: 'Tamaño del equipo',
    availability: 'Disponibilidad',
    availabilityPlaceholder: 'Días/horarios en que normalmente puede realizar turnovers',
    notes: 'Notas adicionales',
    notesPlaceholder: 'Experiencia, limitaciones de horario, servicios especiales o cualquier otra información',
    submit: 'Enviar cotización',
    submitReady: 'Listo para enviar',
    confirmHelp: 'Confirme el precio todo incluido para enviar.',
    contactHelp: 'Proporcione al menos un email o teléfono.',
    privacy: 'Su cotización es privada. Otras empresas de limpieza no pueden ver el precio enviado.',
    errorAll: 'El precio total debe incluir todos los artículos obligatorios antes de enviar.',
    errorContact: 'Proporcione un email o teléfono.',
    errorSubmit: 'No pudimos enviar la cotización. Revise el precio total, el contacto y los artículos incluidos.',
    sentTitle: 'Cotización recibida',
    sentBody: 'Gracias. Su cotización fue enviada correctamente y será revisada.',
    sentNext: 'Si su empresa es seleccionada, usaremos su información de contacto para el siguiente paso.',
  },
} as const

const dateLocales: Record<Language, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es-US',
}

export default function PublicTurnoverQuotePage() {
  const params = useParams<{ token: string }>()
  const token = params?.token || ''
  const [language, setLanguage] = useState<Language>('en')
  const t = copy[language]

  const publicSupabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njwqeulzythluenexdcw.supabase.co'
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq'

    return createBrowserClient(url, key, {
      global: {
        headers: {
          'x-turnover-token': token,
        },
      },
    })
  }, [token])

  const [request, setRequest] = useState<PublicRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorKey, setErrorKey] = useState<'unavailable' | 'unavailableClosed' | 'errorAll' | 'errorContact' | 'errorSubmit' | null>(null)
  const [allCostsConfirmed, setAllCostsConfirmed] = useState(false)
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', total_price: '',
    estimated_hours: '', team_size: '', availability_notes: '', notes: ''
  })

  useEffect(() => {
    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith('pt')) setLanguage('pt')
    else if (browserLanguage.startsWith('es')) setLanguage('es')
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setErrorKey('unavailable')
        setLoading(false)
        return
      }

      const { data, error } = await publicSupabase
        .from('cleaning_turnover_requests')
        .select('id, property_name, property_address, airbnb_url, bedrooms, bathrooms, turnover_date, turnover_notes, photo_urls, status')
        .eq('public_token', token)
        .eq('status', 'open')
        .maybeSingle()

      if (error || !data) setErrorKey('unavailableClosed')
      else setRequest(data as PublicRequest)
      setLoading(false)
    }

    void load()
  }, [publicSupabase, token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorKey(null)

    if (!request) return
    if (!allCostsConfirmed) {
      setErrorKey('errorAll')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setErrorKey('errorContact')
      return
    }

    setSending(true)
    const { error } = await publicSupabase
      .from('cleaning_turnover_quotes')
      .insert({
        request_id: request.id,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        total_price: Number(form.total_price),
        currency: 'USD',
        includes_cleaning_supplies: allCostsConfirmed,
        includes_laundry: allCostsConfirmed,
        includes_paper_towels: allCostsConfirmed,
        includes_toilet_paper: allCostsConfirmed,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        team_size: form.team_size ? Number(form.team_size) : null,
        availability_notes: form.availability_notes.trim() || null,
        notes: form.notes.trim() || null,
      })

    if (error) {
      setErrorKey('errorSubmit')
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const allIncluded = allCostsConfirmed && allCostsConfirmed && allCostsConfirmed && allCostsConfirmed
  const hasContact = Boolean(form.email.trim() || form.phone.trim())
  const canSubmit = allIncluded && hasContact && Boolean(form.company_name.trim()) && Number(form.total_price) > 0

  const languageSwitcher = (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur">
      {([
        ['en', 'EN'],
        ['pt', 'PT'],
        ['es', 'ES'],
      ] as const).map(([code, name]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`rounded-xl px-3 py-2 text-xs font-black transition ${language === code ? 'bg-white text-slate-950 shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          aria-label={`Change language to ${code}`}
        >
          {name}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto flex max-w-7xl justify-end">{languageSwitcher}</div>
      <div className="mx-auto mt-24 max-w-xl text-center text-white/60">
        <Loader2 className="mx-auto mb-4 animate-spin" size={28}/>
        {t.loading}
      </div>
    </main>
  )

  if (!request) return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto flex max-w-7xl justify-end">{languageSwitcher}</div>
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <ShieldCheck className="mx-auto text-white/70" size={42}/>
        <h1 className="mt-5 text-3xl font-black">{t.unavailableTitle}</h1>
        <p className="mt-3 text-white/60">{errorKey ? t[errorKey] : t.unavailable}</p>
      </div>
    </main>
  )

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto flex max-w-7xl justify-end">{languageSwitcher}</div>
        <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-white text-slate-950 shadow-2xl">
          <div className="bg-emerald-50 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
              <CheckCircle2 size={42}/>
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">{t.sentTitle}</h1>
            <p className="mx-auto mt-3 max-w-lg text-lg text-slate-600">{t.sentBody}</p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{t.sentNext}</p>
          </div>
          <div className="grid gap-3 border-t border-slate-100 p-6 sm:grid-cols-3">
            <SuccessItem icon={<ClipboardCheck size={18}/>} text={t.submitReady}/>
            <SuccessItem icon={<ShieldCheck size={18}/>} text={t.privacy}/>
            <SuccessItem icon={<MessageSquare size={18}/>} text={t.sentNext}/>
          </div>
        </div>
      </main>
    )
  }

  const heroPhoto = request.photo_urls?.[0]

  return (
    <main className="min-h-screen bg-[#f5f7f9] text-slate-950">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-black text-slate-950 shadow-lg">XR</div>
            <div>
              <p className="text-sm font-black">{t.header}</p>
              <p className="text-xs text-white/65">{t.headerSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Languages size={17} className="hidden text-white/70 sm:block"/>
            {languageSwitcher}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        {heroPhoto && (
          <>
            <img src={heroPhoto} alt={request.property_name} className="absolute inset-0 h-full w-full object-cover opacity-35"/>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35"/>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"/>
          </>
        )}
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black tracking-[0.12em] text-emerald-200">
              <Sparkles size={14}/>{t.badge}
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              {t.heroBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#quote-form" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5">
                {t.formTitle}<ArrowRight size={17}/>
              </a>
              {request.airbnb_url && (
                <a href={request.airbnb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                  {t.viewListing}<ExternalLink size={16}/>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="-mt-14 relative z-20 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Home size={20}/>} label={t.property} value={request.property_name}/>
          <Stat icon={<BedDouble size={20}/>} label={t.bedrooms} value={String(request.bedrooms ?? '—')}/>
          <Stat icon={<Bath size={20}/>} label={t.bathrooms} value={String(request.bathrooms ?? '—')}/>
          <Stat icon={<ClipboardCheck size={20}/>} label={t.nextTurnover} value={request.turnover_date ? new Date(request.turnover_date + 'T12:00:00').toLocaleDateString(dateLocales[language], { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}/>
        </section>

        {request.photo_urls?.length > 0 && (
          <section className="mt-10">
            <SectionHeader eyebrow={t.property} title={t.gallery}/>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {request.photo_urls.slice(0, 8).map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className={`group relative overflow-hidden rounded-3xl bg-slate-200 ${index === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={url} alt={`${t.gallery} ${index + 1}`} className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/>
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10"/>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_430px] xl:grid-cols-[1fr_470px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeader eyebrow={t.property} title={t.scopeTitle}/>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{t.scopeIntro}</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {t.scopeItems.map((item, index) => {
                  const icons = [<Sparkles key="a" size={17}/>, <Home key="b" size={17}/>, <Check key="c" size={17}/>, <Trash2 key="d" size={17}/>, <RefreshCw key="e" size={17}/>, <BedDouble key="f" size={17}/>, <ClipboardCheck key="g" size={17}/>, <ShieldCheck key="h" size={17}/>, <MessageSquare key="i" size={17}/>, <Camera key="j" size={17}/>]
                  return (
                    <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm">{icons[index]}</div>
                      <p className="text-sm font-semibold leading-5 text-slate-700">{item}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={20}/>
                  <div>
                    <p className="font-black text-blue-950">{t.standardTitle}</p>
                    <p className="mt-1 text-sm leading-6 text-blue-900/75">{t.standardBody}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
              <p className="text-xs font-black tracking-[0.16em] text-amber-300">{t.pricingEyebrow}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{t.pricingTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">{t.pricingBody}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Inclusion icon={<Sparkles size={17}/>} text={t.materials}/>
                <Inclusion icon={<RefreshCw size={17}/>} text={t.laundry}/>
                <Inclusion icon={<ClipboardCheck size={17}/>} text={t.paperTowels}/>
                <Inclusion icon={<CheckCircle2 size={17}/>} text={t.toiletPaper}/>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeader eyebrow="XRankFlow" title={t.processTitle}/>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {t.process.map(([title, body], index) => (
                  <div key={title} className="rounded-2xl border border-slate-100 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">{index + 1}</div>
                    <h3 className="mt-4 font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeader eyebrow={t.property} title={t.scope}/>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">{request.turnover_notes || t.defaultScope}</p>
              {request.property_address && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{t.property}</p>
                  <p className="mt-1 font-bold text-slate-800">{request.property_address}</p>
                </div>
              )}
            </section>
          </div>

          <aside id="quote-form">
            <form onSubmit={submit} className="sticky top-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
              <div className="border-b border-slate-100 bg-slate-950 p-6 text-white sm:p-7">
                <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.14em] text-emerald-300">
                  <DollarSign size={15}/>{t.formEyebrow}
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{t.formTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">{t.formSub}</p>
              </div>

              <div className="p-5 sm:p-6">
                {errorKey && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{t[errorKey]}</div>}

                <div className="space-y-5">
                  <div><label className={label}>{t.company} *</label><input className={field} required maxLength={160} value={form.company_name} onChange={e => setForm(f => ({...f, company_name:e.target.value}))}/></div>
                  <div><label className={label}>{t.contact}</label><input className={field} maxLength={160} value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name:e.target.value}))}/></div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div><label className={label}>{t.email}</label><input className={field} type="email" maxLength={240} value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}/></div>
                    <div><label className={label}>{t.phone}</label><input className={field} inputMode="tel" maxLength={80} value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}/></div>
                  </div>
                  {!hasContact && <p className="-mt-2 text-xs text-amber-600">{t.contactHelp}</p>}

                  <div className="rounded-3xl bg-slate-950 p-5 text-white">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/50">{t.total} *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black">$</span>
                      <input className="w-full bg-transparent text-4xl font-black tracking-tight outline-none placeholder:text-white/20" required min="1" max="100000" step="0.01" type="number" inputMode="decimal" placeholder="0.00" value={form.total_price} onChange={e => setForm(f => ({...f, total_price:e.target.value}))}/>
                    </div>
                  </div>

                  <div>
                    <p className={label}>{t.confirm} *</p>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${allCostsConfirmed ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" checked={allCostsConfirmed} onChange={e => setAllCostsConfirmed(e.target.checked)}/>
                      <span className="space-y-2">
                        <span className="block font-black">{t.confirm}</span>
                        <span className="block leading-6 text-slate-600">{[t.materials,t.laundry,t.paperTowels,t.toiletPaper].join(' · ')}</span>
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={label}>{t.hours}</label><input className={field} min="0.5" max="168" step="0.5" type="number" inputMode="decimal" value={form.estimated_hours} onChange={e => setForm(f => ({...f, estimated_hours:e.target.value}))}/></div>
                    <div><label className={label}>{t.team}</label><input className={field} min="1" max="50" type="number" inputMode="numeric" value={form.team_size} onChange={e => setForm(f => ({...f, team_size:e.target.value}))}/></div>
                  </div>

                  <div><label className={label}>{t.availability}</label><textarea className={field} maxLength={1200} rows={3} value={form.availability_notes} onChange={e => setForm(f => ({...f, availability_notes:e.target.value}))} placeholder={t.availabilityPlaceholder}/></div>
                  <div><label className={label}>{t.notes}</label><textarea className={field} maxLength={3000} rows={4} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder={t.notesPlaceholder}/></div>

                  <button disabled={sending || !canSubmit} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35">
                    {sending ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                    {t.submit}
                    {!sending && <ArrowRight size={17} className="transition group-hover:translate-x-0.5"/>}
                  </button>

                  {!allIncluded && <p className="text-center text-xs leading-5 text-slate-400">{t.confirmHelp}</p>}
                  <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-700"/>
                    <span>{t.privacy}</span>
                  </div>
                </div>
              </div>
            </form>
          </aside>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>XRankFlow Turnover Operations</span>
          <span>{t.headerSub}</span>
        </div>
      </footer>
    </main>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-6">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-[10px] font-black uppercase tracking-[0.15em]">{label}</span></div>
      <p className="mt-2 truncate text-lg font-black text-slate-950" title={value}>{value}</p>
    </div>
  )
}

function Inclusion({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950">{icon}</div>
      <span className="text-sm font-bold text-white/85">{text}</span>
    </div>
  )
}

function SuccessItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
      <span className="mt-0.5 text-emerald-600">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: (value:boolean) => void; label: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm font-bold transition ${checked ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
      <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="flex-1">{label}</span>
      {checked && <Check size={16} className="text-emerald-600"/>}
    </label>
  )
}
