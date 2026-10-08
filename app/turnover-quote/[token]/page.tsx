'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bath, BedDouble, Building2, Check, CheckCircle2, ClipboardCheck, ExternalLink, Loader2, ShieldCheck, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Language = 'en' | 'pt' | 'es'
type CleanerType = 'business' | 'individual'

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

const requiredKeys = ['materials', 'laundry', 'paper', 'toilet', 'trash', 'kitchen', 'bathroom', 'equipment'] as const
type RequiredKey = typeof requiredKeys[number]

const emptyChecks: Record<RequiredKey, boolean> = {
  materials: false, laundry: false, paper: false, toilet: false,
  trash: false, kitchen: false, bathroom: false, equipment: false,
}

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
    inclusions: {
      materials: 'Cleaning supplies and materials',
      laundry: 'Laundry: sheets and towels washed and dried',
      paper: 'Paper towels replaced',
      toilet: 'Toilet paper replaced',
      trash: 'New trash bags and trash removal',
      kitchen: 'Dish soap, sponges and kitchen supplies',
      bathroom: 'Hand soap and bathroom supplies',
      equipment: 'Equipment, transport and travel',
    },
    standard: 'Leave the home guest-ready. If something blocks the job, report it instead of marking it done.',
    hostNotes: 'Host notes',
    formTitle: 'Your application',
    cleanerType: 'You are',
    cleanerTypes: { business: 'Business', individual: 'Individual' },
    company: 'Business or cleaner name',
    email: 'Email',
    phone: 'Phone',
    contactHelp: 'Add an email or phone number.',
    serviceArea: 'Service area (city or neighborhood)',
    experience: 'Years of experience',
    team: 'Team size',
    total: 'Price per turnover, all inclusive',
    checkTitle: 'Check each item your price includes',
    hours: 'Hours per turnover',
    insurance: 'Liability insurance?',
    sameDay: 'Same-day turnovers?',
    yes: 'Yes',
    no: 'No',
    notes: 'Availability and notes',
    notesPlaceholder: 'When you are available, experience, special services…',
    submit: 'Submit application',
    confirmHelp: 'Check all 8 items to submit.',
    privacy: 'Your application is private. Other companies cannot see it.',
    errorAll: 'Check all 8 included items before submitting.',
    errorContact: 'Add an email or phone number.',
    errorSubmit: 'We could not submit the application. Please check the price and included items.',
    sentTitle: 'Application received',
    sentBody: 'Thank you. We will review it and contact you if you are selected.',
    loading: 'Loading…',
    unavailableTitle: 'Application unavailable',
    unavailable: 'This application is unavailable.',
    unavailableClosed: 'This application is unavailable or bidding has closed.',
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
    inclusions: {
      materials: 'Produtos e materiais de limpeza',
      laundry: 'Lavanderia: roupas de cama e toalhas lavadas e secas',
      paper: 'Papel-toalha reposto',
      toilet: 'Papel higiênico reposto',
      trash: 'Sacos de lixo novos e retirada do lixo',
      kitchen: 'Detergente, esponjas e itens de cozinha',
      bathroom: 'Sabonete de mão e itens do banheiro',
      equipment: 'Equipamentos, transporte e deslocamento',
    },
    standard: 'Deixe o imóvel pronto para o próximo hóspede. Se algo impedir o trabalho, reporte em vez de marcar como concluído.',
    hostNotes: 'Observações do anfitrião',
    formTitle: 'Sua candidatura',
    cleanerType: 'Você é',
    cleanerTypes: { business: 'Empresa', individual: 'Pessoa física' },
    company: 'Nome da empresa ou do profissional',
    email: 'Email',
    phone: 'Telefone',
    contactHelp: 'Informe um email ou telefone.',
    serviceArea: 'Região de atendimento (cidade ou bairro)',
    experience: 'Anos de experiência',
    team: 'Tamanho da equipe',
    total: 'Preço por turnover, tudo incluído',
    checkTitle: 'Marque cada item que seu preço inclui',
    hours: 'Horas por turnover',
    insurance: 'Seguro de responsabilidade civil?',
    sameDay: 'Turnovers no mesmo dia?',
    yes: 'Sim',
    no: 'Não',
    notes: 'Disponibilidade e observações',
    notesPlaceholder: 'Quando você está disponível, experiência, serviços especiais…',
    submit: 'Enviar candidatura',
    confirmHelp: 'Marque os 8 itens para enviar.',
    privacy: 'Sua candidatura é privada. Outras empresas não podem vê-la.',
    errorAll: 'Marque os 8 itens incluídos antes de enviar.',
    errorContact: 'Informe um email ou telefone.',
    errorSubmit: 'Não foi possível enviar. Revise o preço e os itens incluídos.',
    sentTitle: 'Candidatura recebida',
    sentBody: 'Obrigado. Vamos analisar e entrar em contato se você for selecionado.',
    loading: 'Carregando…',
    unavailableTitle: 'Candidatura indisponível',
    unavailable: 'Esta candidatura não está disponível.',
    unavailableClosed: 'Esta candidatura não está disponível ou o período de orçamentos foi encerrado.',
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
    inclusions: {
      materials: 'Productos y materiales de limpieza',
      laundry: 'Lavandería: ropa de cama y toallas lavadas y secas',
      paper: 'Toallas de papel repuestas',
      toilet: 'Papel higiénico repuesto',
      trash: 'Bolsas de basura nuevas y retiro de basura',
      kitchen: 'Detergente, esponjas y artículos de cocina',
      bathroom: 'Jabón de manos y artículos del baño',
      equipment: 'Equipos, transporte y traslado',
    },
    standard: 'Deje la propiedad lista para el próximo huésped. Si algo impide el trabajo, repórtelo en vez de marcarlo como terminado.',
    hostNotes: 'Notas del anfitrión',
    formTitle: 'Su solicitud',
    cleanerType: 'Usted es',
    cleanerTypes: { business: 'Empresa', individual: 'Persona física' },
    company: 'Nombre de la empresa o del profesional',
    email: 'Email',
    phone: 'Teléfono',
    contactHelp: 'Indique un email o teléfono.',
    serviceArea: 'Zona de servicio (ciudad o barrio)',
    experience: 'Años de experiencia',
    team: 'Tamaño del equipo',
    total: 'Precio por turnover, todo incluido',
    checkTitle: 'Marque cada artículo que incluye su precio',
    hours: 'Horas por turnover',
    insurance: '¿Seguro de responsabilidad civil?',
    sameDay: '¿Turnovers el mismo día?',
    yes: 'Sí',
    no: 'No',
    notes: 'Disponibilidad y notas',
    notesPlaceholder: 'Cuándo está disponible, experiencia, servicios especiales…',
    submit: 'Enviar solicitud',
    confirmHelp: 'Marque los 8 artículos para enviar.',
    privacy: 'Su solicitud es privada. Otras empresas no pueden verla.',
    errorAll: 'Marque los 8 artículos incluidos antes de enviar.',
    errorContact: 'Indique un email o teléfono.',
    errorSubmit: 'No pudimos enviar la solicitud. Revise el precio y los artículos incluidos.',
    sentTitle: 'Solicitud recibida',
    sentBody: 'Gracias. La revisaremos y le contactaremos si es seleccionado.',
    loading: 'Cargando…',
    unavailableTitle: 'Solicitud no disponible',
    unavailable: 'Esta solicitud no está disponible.',
    unavailableClosed: 'Esta solicitud no está disponible o la recepción de cotizaciones ya cerró.',
  },
} as const

const dateLocales: Record<Language, string> = { en: 'en-US', pt: 'pt-BR', es: 'es-US' }

type ErrorKey = 'unavailable' | 'unavailableClosed' | 'errorAll' | 'errorContact' | 'errorSubmit'

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
  const [cleanerType, setCleanerType] = useState<CleanerType>('business')
  const [checks, setChecks] = useState<Record<RequiredKey, boolean>>(emptyChecks)
  const [insurance, setInsurance] = useState<boolean | null>(null)
  const [sameDay, setSameDay] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    company_name: '', email: '', phone: '', service_area: '', years_experience: '',
    team_size: '', total_price: '', estimated_hours: '', availability_notes: '',
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

  const allIncluded = requiredKeys.every(key => checks[key])
  const hasContact = Boolean(form.email.trim() || form.phone.trim())
  const canSubmit = allIncluded && hasContact && Boolean(form.company_name.trim()) && Number(form.total_price) > 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorKey(null)

    if (!request) return
    if (!allIncluded) return setErrorKey('errorAll')
    if (!hasContact) return setErrorKey('errorContact')

    setSending(true)
    const { error } = await publicSupabase
      .from('cleaning_turnover_quotes')
      .insert({
        request_id: request.id,
        company_name: form.company_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        total_price: Number(form.total_price),
        currency: 'USD',
        includes_cleaning_supplies: checks.materials,
        includes_laundry: checks.laundry,
        includes_paper_towels: checks.paper,
        includes_toilet_paper: checks.toilet,
        includes_trash_removal: checks.trash,
        includes_kitchen_supplies: checks.kitchen,
        includes_bathroom_supplies: checks.bathroom,
        includes_equipment_transport: checks.equipment,
        cleaner_type: cleanerType,
        service_area: form.service_area.trim() || null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        has_insurance: insurance,
        same_day_available: sameDay,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        team_size: form.team_size ? Number(form.team_size) : null,
        availability_notes: form.availability_notes.trim() || null,
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
            {requiredKeys.map(key => (
              <li key={key} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d6784a]"><Check size={12}/></span>
                {t.inclusions[key]}
              </li>
            ))}
          </ul>
          <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-6 text-white/70">{t.standard}</p>
        </section>

        <section id="application" className="mt-14 scroll-mt-6 pb-20">
          <h2 className={`${serif} text-3xl`}>{t.formTitle}</h2>

          <form onSubmit={submit} className="mt-6 space-y-7 rounded-3xl bg-white p-6 shadow-sm sm:p-9">
            {errorKey && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t[errorKey]}</p>}

            <div>
              <p className={label}>{t.cleanerType}</p>
              <Segment<CleanerType>
                options={[['business', t.cleanerTypes.business], ['individual', t.cleanerTypes.individual]]}
                value={cleanerType}
                onChange={setCleanerType}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="company">{t.company} *</label>
                <input id="company" className={input} required maxLength={160} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}/>
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
              <div className="sm:col-span-2">
                <label className={label} htmlFor="area">{t.serviceArea}</label>
                <input id="area" className={input} maxLength={160} value={form.service_area} onChange={e => setForm(f => ({ ...f, service_area: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="experience">{t.experience}</label>
                <input id="experience" type="number" min="0" max="80" inputMode="numeric" className={input} value={form.years_experience} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))}/>
              </div>
              <div>
                <label className={label} htmlFor="team">{t.team}</label>
                <input id="team" type="number" min="1" max="50" inputMode="numeric" className={input} value={form.team_size} onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))}/>
              </div>
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

            <div>
              <p className={label}>{t.checkTitle} *</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {requiredKeys.map(key => (
                  <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${checks[key] ? 'border-[#3f6b4f] bg-[#eef4ef] text-[#1d2a22]' : 'border-[#d9d2c5] text-[#4a5247] hover:border-[#8a8373]'}`}>
                    <input type="checkbox" className="h-4 w-4 accent-[#3f6b4f]" checked={checks[key]} onChange={e => setChecks(c => ({ ...c, [key]: e.target.checked }))}/>
                    {t.inclusions[key]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="hours">{t.hours}</label>
                <input id="hours" type="number" min="0.5" max="168" step="0.5" inputMode="decimal" className={input} value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}/>
              </div>
              <div>
                <p className={label}>{t.insurance}</p>
                <Segment<boolean> options={[[true, t.yes], [false, t.no]]} value={insurance} onChange={setInsurance}/>
              </div>
              <div>
                <p className={label}>{t.sameDay}</p>
                <Segment<boolean> options={[[true, t.yes], [false, t.no]]} value={sameDay} onChange={setSameDay}/>
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
              {!allIncluded && <p className="mt-3 text-center text-xs text-[#8a8373]">{t.confirmHelp}</p>}
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

function Segment<T extends string | boolean>({ options, value, onChange }: { options: [T, string][]; value: T | null; onChange: (value: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([option, text]) => (
        <button
          key={String(option)}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition ${value === option ? 'border-[#1d2a22] bg-[#1d2a22] text-white' : 'border-[#d9d2c5] text-[#4a5247] hover:border-[#8a8373]'}`}
        >
          {option === 'business' && <Building2 size={15}/>}
          {option === 'individual' && <User size={15}/>}
          {text}
        </button>
      ))}
    </div>
  )
}
