'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bath, BedDouble, Check, CheckCircle2, ClipboardCheck, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
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
  extra_inclusions: string[]
  status: string
}

type ErrorKey = 'unavailable' | 'unavailableClosed' | 'errorAll' | 'errorContact' | 'errorSubmit' | 'missingAnswers'

const baseKeys = ['materials', 'laundry', 'paperTowels', 'toiletPaper'] as const

const input = 'w-full rounded-xl border border-[#d9d2c5] bg-white px-4 py-3 text-base text-[#1d2a22] outline-none placeholder:text-[#a39b8c] focus:border-[#1d2a22] focus:ring-2 focus:ring-[#1d2a22]/10'
const label = 'mb-1.5 block text-sm font-semibold text-[#1d2a22]'
const serif = 'font-serif'

const copy = {
  en: {
    eyebrow: 'Cleaning partner application',
    headline: 'Turnover cleaning for this Airbnb home',
    intro: 'Tell us about your team and your all-inclusive price per turnover. It takes about 5 minutes.',
    cta: 'Start application',
    listing: 'View Airbnb listing',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    nextTurnover: 'Next turnover',
    homeTitle: 'The home',
    mustTitle: 'Your price must include',
    mustIntro: 'Everything below is part of one price per turnover. No add-ons later.',
    base: { materials: 'Cleaning supplies & materials', laundry: 'Laundry', paperTowels: 'Paper towels', toiletPaper: 'Toilet paper' },
    extrasTitle: 'Additional items for this home',
    standard: 'Leave the home guest-ready. If something blocks the job, report it instead of marking it done.',
    hostNotes: 'Host notes',
    formTitle: 'Your application',
    company: 'Company / cleaner name',
    contact: 'Contact name',
    email: 'Email',
    phone: 'Phone',
    contactHelp: 'Add an email or phone number.',
    total: 'Price per turnover, all inclusive',
    confirm: 'I confirm my price includes everything listed above',
    quickTitle: 'Quick service questions',
    notice: 'Advance notice needed (hours)',
    sameDay: 'Can you handle same-day checkout and check-in?',
    yes: 'Yes',
    no: 'No',
    equipment: 'What cleaning equipment do you bring?',
    equipmentHint: 'Vacuum, mop, tools, etc.',
    laundryMethod: 'Where do you wash sheets and towels?',
    laundryPlaces: { on_site: 'At the Airbnb', off_site: 'Off-site / laundromat', both: 'Both' },
    laundryProcess: 'How do you wash and dry used linens after checkout, and prepare fresh ones before check-in?',
    laundryPolicy: 'Washing and drying are included in your price. No unwashed reuse.',
    experience: 'Years of Airbnb cleaning experience (optional)',
    insurance: 'Business liability insurance?',
    completionPhotos: 'I agree to send completion photos',
    hours: 'Estimated hours',
    team: 'Team size',
    notes: 'Availability and notes',
    notesPlaceholder: 'Days/times you are available, experience, special services…',
    submit: 'Submit quote',
    confirmHelp: 'Confirm the all-inclusive price and answer the quick questions to submit.',
    missingAnswers: 'Complete the quick service questions to submit.',
    privacy: 'Your quote is private. Other companies cannot see it.',
    errorAll: 'Confirm the all-inclusive price before submitting.',
    errorContact: 'Add an email or phone number.',
    errorSubmit: 'We could not submit the quote. Please check the price and answers.',
    sentTitle: 'Quote received',
    sentBody: 'Thank you. We will review your quote and contact you if selected.',
    loading: 'Loading…',
    unavailableTitle: 'Quote request unavailable',
    unavailable: 'This quote request is unavailable.',
    unavailableClosed: 'This quote request is unavailable or bidding has closed.',
  },
  pt: {
    eyebrow: 'Candidatura de parceiro de limpeza',
    headline: 'Limpeza de turnover para este imóvel Airbnb',
    intro: 'Conte sobre sua equipe e seu preço por turnover, com tudo incluído. Leva cerca de 5 minutos.',
    cta: 'Iniciar candidatura',
    listing: 'Ver anúncio no Airbnb',
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    nextTurnover: 'Próximo turnover',
    homeTitle: 'O imóvel',
    mustTitle: 'Seu preço precisa incluir',
    mustIntro: 'Tudo abaixo faz parte de um único preço por turnover. Sem cobranças extras depois.',
    base: { materials: 'Produtos e materiais de limpeza', laundry: 'Lavanderia', paperTowels: 'Papel-toalha', toiletPaper: 'Papel higiênico' },
    extrasTitle: 'Itens adicionais deste imóvel',
    standard: 'Deixe o imóvel pronto para o próximo hóspede. Se algo impedir o trabalho, reporte em vez de marcar como concluído.',
    hostNotes: 'Observações do anfitrião',
    formTitle: 'Sua candidatura',
    company: 'Nome da empresa ou do profissional',
    contact: 'Nome do contato',
    email: 'Email',
    phone: 'Telefone',
    contactHelp: 'Informe um email ou telefone.',
    total: 'Preço por turnover, tudo incluído',
    confirm: 'Confirmo que meu preço inclui tudo o que está listado acima',
    quickTitle: 'Perguntas rápidas do serviço',
    notice: 'Antecedência necessária (horas)',
    sameDay: 'Você consegue fazer checkout e check-in no mesmo dia?',
    yes: 'Sim',
    no: 'Não',
    equipment: 'Quais equipamentos de limpeza você leva?',
    equipmentHint: 'Aspirador, mop, ferramentas etc.',
    laundryMethod: 'Onde você lava lençóis e toalhas?',
    laundryPlaces: { on_site: 'No Airbnb', off_site: 'Fora / lavanderia', both: 'Os dois' },
    laundryProcess: 'Como você lava e seca a roupa usada após o checkout e prepara a roupa limpa antes do check-in?',
    laundryPolicy: 'Lavagem e secagem estão incluídas no preço. Nada de reaproveitar roupa sem lavar.',
    experience: 'Anos de experiência com limpeza de Airbnb (opcional)',
    insurance: 'Seguro de responsabilidade civil empresarial?',
    completionPhotos: 'Concordo em enviar fotos de conclusão',
    hours: 'Horas estimadas',
    team: 'Tamanho da equipe',
    notes: 'Disponibilidade e observações',
    notesPlaceholder: 'Dias/horários disponíveis, experiência, serviços especiais…',
    submit: 'Enviar orçamento',
    confirmHelp: 'Confirme o preço completo e responda as perguntas rápidas para enviar.',
    missingAnswers: 'Responda as perguntas rápidas do serviço para enviar.',
    privacy: 'Seu orçamento é privado. Outras empresas não podem vê-lo.',
    errorAll: 'Confirme o preço completo antes de enviar.',
    errorContact: 'Informe um email ou telefone.',
    errorSubmit: 'Não foi possível enviar. Revise o preço e as respostas.',
    sentTitle: 'Orçamento recebido',
    sentBody: 'Obrigado. Analisaremos seu orçamento e entraremos em contato se for selecionado.',
    loading: 'Carregando…',
    unavailableTitle: 'Solicitação indisponível',
    unavailable: 'Esta solicitação não está disponível.',
    unavailableClosed: 'Esta solicitação não está disponível ou o período de orçamentos foi encerrado.',
  },
  es: {
    eyebrow: 'Solicitud de socio de limpieza',
    headline: 'Limpieza de turnover para esta propiedad de Airbnb',
    intro: 'Cuéntenos sobre su equipo y su precio por turnover, todo incluido. Toma unos 5 minutos.',
    cta: 'Iniciar solicitud',
    listing: 'Ver anuncio en Airbnb',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    nextTurnover: 'Próximo turnover',
    homeTitle: 'La propiedad',
    mustTitle: 'Su precio debe incluir',
    mustIntro: 'Todo lo de abajo forma parte de un solo precio por turnover. Sin cargos extra después.',
    base: { materials: 'Productos y materiales de limpieza', laundry: 'Lavandería', paperTowels: 'Toallas de papel', toiletPaper: 'Papel higiénico' },
    extrasTitle: 'Artículos adicionales de esta propiedad',
    standard: 'Deje la propiedad lista para el próximo huésped. Si algo impide el trabajo, repórtelo en vez de marcarlo como terminado.',
    hostNotes: 'Notas del anfitrión',
    formTitle: 'Su solicitud',
    company: 'Nombre de la empresa o del profesional',
    contact: 'Nombre de contacto',
    email: 'Email',
    phone: 'Teléfono',
    contactHelp: 'Indique un email o teléfono.',
    total: 'Precio por turnover, todo incluido',
    confirm: 'Confirmo que mi precio incluye todo lo indicado arriba',
    quickTitle: 'Preguntas rápidas del servicio',
    notice: 'Aviso previo necesario (horas)',
    sameDay: '¿Puede hacer checkout y check-in el mismo día?',
    yes: 'Sí',
    no: 'No',
    equipment: '¿Qué equipos de limpieza lleva?',
    equipmentHint: 'Aspiradora, mopa, herramientas, etc.',
    laundryMethod: '¿Dónde lava sábanas y toallas?',
    laundryPlaces: { on_site: 'En el Airbnb', off_site: 'Fuera / lavandería', both: 'Ambos' },
    laundryProcess: '¿Cómo lava y seca la ropa usada después del checkout y prepara la ropa limpia antes del check-in?',
    laundryPolicy: 'Lavado y secado están incluidos en el precio. Nada de reutilizar ropa sin lavar.',
    experience: 'Años de experiencia en limpieza de Airbnb (opcional)',
    insurance: '¿Seguro de responsabilidad civil empresarial?',
    completionPhotos: 'Acepto enviar fotos de finalización',
    hours: 'Horas estimadas',
    team: 'Tamaño del equipo',
    notes: 'Disponibilidad y notas',
    notesPlaceholder: 'Días/horarios disponibles, experiencia, servicios especiales…',
    submit: 'Enviar cotización',
    confirmHelp: 'Confirme el precio completo y responda las preguntas rápidas para enviar.',
    missingAnswers: 'Responda las preguntas rápidas del servicio para enviar.',
    privacy: 'Su cotización es privada. Otras empresas no pueden verla.',
    errorAll: 'Confirme el precio completo antes de enviar.',
    errorContact: 'Indique un email o teléfono.',
    errorSubmit: 'No pudimos enviar la cotización. Revise el precio y las respuestas.',
    sentTitle: 'Cotización recibida',
    sentBody: 'Gracias. Revisaremos su cotización y le contactaremos si es seleccionado.',
    loading: 'Cargando…',
    unavailableTitle: 'Solicitud no disponible',
    unavailable: 'Esta solicitud no está disponible.',
    unavailableClosed: 'Esta solicitud no está disponible o la recepción de cotizaciones ya cerró.',
  },
} as const

const dateLocales: Record<Language, string> = { en: 'en-US', pt: 'pt-BR', es: 'es-US' }

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
      global: { headers: { 'x-turnover-token': token } },
    })
  }, [token])

  const [request, setRequest] = useState<PublicRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)
  const [allCostsConfirmed, setAllCostsConfirmed] = useState(false)
  const [noticeHours, setNoticeHours] = useState('')
  const [sameDay, setSameDay] = useState('')
  const [equipment, setEquipment] = useState('')
  const [laundryMethod, setLaundryMethod] = useState('')
  const [laundryProcess, setLaundryProcess] = useState('')
  const [experience, setExperience] = useState('')
  const [insured, setInsured] = useState('')
  const [completionPhotos, setCompletionPhotos] = useState(false)
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', total_price: '',
    estimated_hours: '', team_size: '', availability_notes: '', notes: '',
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
        .select('id, property_name, property_address, airbnb_url, bedrooms, bathrooms, turnover_date, turnover_notes, photo_urls, extra_inclusions, status')
        .eq('public_token', token)
        .eq('status', 'open')
        .maybeSingle()

      if (error || !data) setErrorKey('unavailableClosed')
      else setRequest(data as PublicRequest)
      setLoading(false)
    }

    void load()
  }, [publicSupabase, token])

  const hasContact = Boolean(form.email.trim() || form.phone.trim())
  const answersComplete = noticeHours !== '' && sameDay !== '' && equipment.trim().length >= 3 && laundryMethod !== '' && laundryProcess.trim().length >= 10 && completionPhotos
  const canSubmit = allCostsConfirmed && answersComplete && hasContact && Boolean(form.company_name.trim()) && Number(form.total_price) > 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorKey(null)

    if (!request) return
    if (!allCostsConfirmed) return setErrorKey('errorAll')
    if (!hasContact) return setErrorKey('errorContact')
    if (!answersComplete) return setErrorKey('missingAnswers')

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
        confirmed_inclusions: allCostsConfirmed ? (request.extra_inclusions || []) : [],
        minimum_notice_hours: noticeHours === '' ? null : Number(noticeHours),
        same_day_turnover: sameDay === 'yes',
        equipment_details: equipment.trim(),
        laundry_method: laundryMethod,
        laundry_process: laundryProcess.trim(),
        years_experience: experience === '' ? null : Number(experience),
        has_insurance: insured === '' ? null : insured === 'yes',
        completion_photos_agreed: completionPhotos,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        team_size: form.team_size ? Number(form.team_size) : null,
        availability_notes: form.availability_notes.trim() || null,
        notes: form.notes.trim() || null,
      })

    setSending(false)
    if (error) return setErrorKey('errorSubmit')

    setSent(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const languageSwitcher = (
    <div className="flex gap-0.5 rounded-full bg-white/15 p-1 text-xs font-semibold backdrop-blur">
      {(['en', 'pt', 'es'] as const).map(code => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-label={`Change language to ${code}`}
          className={`rounded-full px-3 py-1.5 uppercase transition ${language === code ? 'bg-white text-[#1d2a22]' : 'text-white/80 hover:text-white'}`}
        >
          {code}
        </button>
      ))}
    </div>
  )

  const brand = (
    <div className="flex items-center justify-between px-5 py-5 sm:px-10">
      <span className={`${serif} text-lg text-white`}>XRankFlow</span>
      {languageSwitcher}
    </div>
  )

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#5b6358]">
      <Loader2 className="mr-2 animate-spin" size={18}/>{t.loading}
    </main>
  )

  if (!request) return (
    <main className="min-h-screen bg-[#1d2a22] text-white">
      {brand}
      <div className="mx-auto mt-16 max-w-md px-6 text-center">
        <ShieldCheck className="mx-auto text-white/60" size={36}/>
        <h1 className={`${serif} mt-5 text-3xl`}>{t.unavailableTitle}</h1>
        <p className="mt-3 text-white/70">{errorKey ? t[errorKey] : t.unavailable}</p>
      </div>
    </main>
  )

  if (sent) return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#1d2a22]">
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto text-[#3f6b4f]" size={48}/>
        <h1 className={`${serif} mt-5 text-4xl`}>{t.sentTitle}</h1>
        <p className="mt-3 text-[#5b6358]">{t.sentBody}</p>
      </div>
    </main>
  )

  const photos = request.photo_urls ?? []
  const hero = photos[0]
  const extras = request.extra_inclusions ?? []

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#1d2a22]">
      <section className="relative overflow-hidden bg-[#1d2a22] text-white">
        {hero && <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d2a22] via-[#1d2a22]/70 to-[#1d2a22]/30"/>
        <div className="relative">
          {brand}
          <div className="mx-auto max-w-5xl px-5 pb-28 pt-20 sm:px-10 sm:pt-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{t.eyebrow}</p>
            <h1 className={`${serif} mt-4 max-w-3xl text-4xl leading-[1.08] sm:text-6xl`}>{t.headline}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{t.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#application" className="inline-flex items-center gap-2 rounded-full bg-[#d6784a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#c4663b]">
                {t.cta}<ArrowRight size={16}/>
              </a>
              {request.airbnb_url && (
                <a href={request.airbnb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white">
                  {t.listing}<ExternalLink size={14}/>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-10">
        <div className="-mt-16 relative z-10 grid grid-cols-3 gap-3">
          <Fact icon={<BedDouble size={18}/>} value={String(request.bedrooms ?? '—')} label={t.bedrooms}/>
          <Fact icon={<Bath size={18}/>} value={String(request.bathrooms ?? '—')} label={t.bathrooms}/>
          <Fact
            icon={<ClipboardCheck size={18}/>}
            value={request.turnover_date ? new Date(request.turnover_date + 'T12:00:00').toLocaleDateString(dateLocales[language], { month: 'short', day: 'numeric' }) : 'TBD'}
            label={t.nextTurnover}
          />
        </div>

        {request.turnover_notes && (
          <div className="mt-6 rounded-2xl bg-white p-5 text-sm leading-6 text-[#4a5247] shadow-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#8a8373]">{t.hostNotes}</p>
            <p className="whitespace-pre-wrap">{request.turnover_notes}</p>
          </div>
        )}

        {photos.length > 0 && (
          <section className="mt-14">
            <h2 className={`${serif} text-3xl`}>{t.homeTitle}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl bg-[#e9e4d9]">
                  <img src={url} alt={`${t.homeTitle} ${index + 1}`} loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition duration-500 hover:scale-[1.03]"/>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-3xl bg-[#1d2a22] p-7 text-white sm:p-10">
          <h2 className={`${serif} text-3xl`}>{t.mustTitle}</h2>
          <p className="mt-2 text-sm text-white/70">{t.mustIntro}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {baseKeys.map(key => (
              <li key={key} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6784a]"><Check size={12}/></span>
                {t.base[key]}
              </li>
            ))}
          </ul>
          {extras.length > 0 && (
            <div className="mt-7 border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">{t.extrasTitle}</p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {extras.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6784a]"><Check size={12}/></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-6 text-white/70">{t.standard}</p>
        </section>

        <section id="application" className="mt-14 scroll-mt-6 pb-20">
          <h2 className={`${serif} text-3xl`}>{t.formTitle}</h2>

          <form onSubmit={submit} className="mt-6 space-y-7 rounded-3xl bg-white p-6 shadow-sm sm:p-9">
            {errorKey && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t[errorKey]}</p>}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="company">{t.company} *</label>
                <input id="company" className={input} required maxLength={160} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="contact">{t.contact}</label>
                <input id="contact" className={input} maxLength={160} value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="email">{t.email}</label>
                <input id="email" type="email" className={input} maxLength={240} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="phone">{t.phone}</label>
                <input id="phone" inputMode="tel" className={input} maxLength={80} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
              </div>
              {!hasContact && <p className="text-xs text-[#9a6b1f] sm:col-span-2">{t.contactHelp}</p>}
            </div>

            <div>
              <label className={label} htmlFor="total">{t.total} *</label>
              <div className="flex items-center rounded-xl border border-[#d9d2c5] bg-white px-4 focus-within:border-[#1d2a22] focus-within:ring-2 focus-within:ring-[#1d2a22]/10">
                <span className={`${serif} text-2xl text-[#8a8373]`}>$</span>
                <input id="total" required min="1" max="100000" step="0.01" type="number" inputMode="decimal" placeholder="0.00"
                  className="w-full bg-transparent py-3 pl-1 text-2xl font-semibold outline-none placeholder:text-[#c9c2b4]"
                  value={form.total_price} onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}/>
              </div>
            </div>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm font-semibold transition ${allCostsConfirmed ? 'border-[#3f6b4f] bg-[#eef4ef]' : 'border-[#d9d2c5] hover:border-[#8a8373]'}`}>
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#3f6b4f]" checked={allCostsConfirmed} onChange={e => setAllCostsConfirmed(e.target.checked)}/>
              {t.confirm}
            </label>

            <div>
              <p className={`${label} text-[#8a8373]`}>{t.quickTitle}</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="notice">{t.notice} *</label>
                  <input id="notice" type="number" min="0" max="720" className={input} value={noticeHours} onChange={e => setNoticeHours(e.target.value)}/>
                </div>
                <div>
                  <p className={label}>{t.sameDay} *</p>
                  <Segment options={[['yes', t.yes], ['no', t.no]]} value={sameDay} onChange={setSameDay}/>
                </div>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="equipment">{t.equipment} *</label>
                  <input id="equipment" className={input} maxLength={300} placeholder={t.equipmentHint} value={equipment} onChange={e => setEquipment(e.target.value)}/>
                </div>
                <div className="sm:col-span-2">
                  <p className={label}>{t.laundryMethod} *</p>
                  <Segment
                    options={[['on_site', t.laundryPlaces.on_site], ['off_site', t.laundryPlaces.off_site], ['both', t.laundryPlaces.both]]}
                    value={laundryMethod}
                    onChange={setLaundryMethod}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="process">{t.laundryProcess} *</label>
                  <textarea id="process" rows={3} maxLength={1200} className={input} value={laundryProcess} onChange={e => setLaundryProcess(e.target.value)}/>
                  <p className="mt-1.5 text-xs text-[#8a8373]">{t.laundryPolicy}</p>
                </div>
                <div>
                  <label className={label} htmlFor="experience">{t.experience}</label>
                  <input id="experience" type="number" min="0" max="70" inputMode="numeric" className={input} value={experience} onChange={e => setExperience(e.target.value)}/>
                </div>
                <div>
                  <p className={label}>{t.insurance}</p>
                  <Segment options={[['yes', t.yes], ['no', t.no]]} value={insured} onChange={setInsured}/>
                </div>
              </div>
              <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm font-semibold transition ${completionPhotos ? 'border-[#3f6b4f] bg-[#eef4ef]' : 'border-[#d9d2c5] hover:border-[#8a8373]'}`}>
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#3f6b4f]" checked={completionPhotos} onChange={e => setCompletionPhotos(e.target.checked)}/>
                {t.completionPhotos} *
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="hours">{t.hours}</label>
                <input id="hours" type="number" min="0.5" max="168" step="0.5" inputMode="decimal" className={input} value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="team">{t.team}</label>
                <input id="team" type="number" min="1" max="50" inputMode="numeric" className={input} value={form.team_size} onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))}/>
              </div>
            </div>

            <div>
              <label className={label} htmlFor="notes">{t.notes}</label>
              <textarea id="notes" rows={3} maxLength={1200} className={input} placeholder={t.notesPlaceholder} value={form.availability_notes} onChange={e => setForm(f => ({ ...f, availability_notes: e.target.value }))}/>
            </div>

            <div>
              <button disabled={sending || !canSubmit} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d6784a] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#c4663b] disabled:cursor-not-allowed disabled:opacity-40">
                {sending && <Loader2 className="animate-spin" size={18}/>}
                {t.submit}
              </button>
              {!canSubmit && <p className="mt-3 text-center text-xs text-[#8a8373]">{t.confirmHelp}</p>}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#8a8373]">
                <ShieldCheck size={14}/>{t.privacy}
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md shadow-black/5 sm:p-5">
      <div className="text-[#d6784a]">{icon}</div>
      <p className={`${serif} mt-2 text-2xl sm:text-3xl`}>{value}</p>
      <p className="text-xs text-[#8a8373] sm:text-sm">{label}</p>
    </div>
  )
}

function Segment<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T | '' | null; onChange: (value: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${value === option ? 'border-[#1d2a22] bg-[#1d2a22] text-white' : 'border-[#d9d2c5] text-[#4a5247] hover:border-[#8a8373]'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
