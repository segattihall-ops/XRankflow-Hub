'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle2, ExternalLink, Loader2, ShieldCheck, User } from 'lucide-react'
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

const input = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10'
const label = 'mb-1.5 block text-sm font-semibold text-slate-700'
const section = 'space-y-4 border-t border-slate-200 pt-6'

const copy = {
  en: {
    header: 'Airbnb turnover quote',
    loading: 'Loading…',
    unavailableTitle: 'Quote request unavailable',
    unavailable: 'This quote request is unavailable.',
    unavailableClosed: 'This quote request is unavailable or bidding has closed.',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    nextTurnover: 'Next turnover',
    listing: 'View Airbnb listing',
    photos: 'Photos',
    rule: 'Leave the property guest-ready. If something blocks the job, report it instead of marking it done.',
    hostNotes: 'Host notes',
    formTitle: 'Your quote',
    formSub: 'One all-inclusive price per turnover.',
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
    included: 'Included in your price (check all 8)',
    inclusions: {
      materials: 'Cleaning supplies',
      laundry: 'Laundry (linens & towels)',
      paper: 'Paper towels',
      toilet: 'Toilet paper',
      trash: 'Trash bags & removal',
      kitchen: 'Dish soap & kitchen supplies',
      bathroom: 'Hand soap & bathroom supplies',
      equipment: 'Equipment & transport',
    },
    hours: 'Hours per turnover',
    insurance: 'Liability insurance?',
    sameDay: 'Same-day turnovers?',
    yes: 'Yes',
    no: 'No',
    notes: 'Availability & notes',
    notesPlaceholder: 'When you are available, experience, special services…',
    submit: 'Submit quote',
    confirmHelp: 'Check all 8 inclusions to submit.',
    privacy: 'Your quote is private. Other companies cannot see it.',
    errorAll: 'Check all 8 included items before submitting.',
    errorContact: 'Add an email or phone number.',
    errorSubmit: 'We could not submit the quote. Please check the price and included items.',
    sentTitle: 'Quote received',
    sentBody: 'Thank you. We will review your quote and contact you if selected.',
  },
  pt: {
    header: 'Orçamento de turnover Airbnb',
    loading: 'Carregando…',
    unavailableTitle: 'Solicitação indisponível',
    unavailable: 'Esta solicitação não está disponível.',
    unavailableClosed: 'Esta solicitação não está disponível ou o período de orçamentos foi encerrado.',
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    nextTurnover: 'Próximo turnover',
    listing: 'Ver anúncio no Airbnb',
    photos: 'Fotos',
    rule: 'Deixe o imóvel pronto para o próximo hóspede. Se algo impedir o trabalho, reporte em vez de marcar como concluído.',
    hostNotes: 'Observações do anfitrião',
    formTitle: 'Seu orçamento',
    formSub: 'Um preço total por turnover, com tudo incluído.',
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
    included: 'Incluído no seu preço (marque os 8)',
    inclusions: {
      materials: 'Produtos de limpeza',
      laundry: 'Lavanderia (roupa de cama e toalhas)',
      paper: 'Papel-toalha',
      toilet: 'Papel higiênico',
      trash: 'Sacos de lixo e retirada',
      kitchen: 'Detergente e itens de cozinha',
      bathroom: 'Sabonete e itens do banheiro',
      equipment: 'Equipamentos e transporte',
    },
    hours: 'Horas por turnover',
    insurance: 'Seguro de responsabilidade civil?',
    sameDay: 'Turnovers no mesmo dia?',
    yes: 'Sim',
    no: 'Não',
    notes: 'Disponibilidade e observações',
    notesPlaceholder: 'Quando você está disponível, experiência, serviços especiais…',
    submit: 'Enviar orçamento',
    confirmHelp: 'Marque os 8 itens para enviar.',
    privacy: 'Seu orçamento é privado. Outras empresas não podem vê-lo.',
    errorAll: 'Marque os 8 itens incluídos antes de enviar.',
    errorContact: 'Informe um email ou telefone.',
    errorSubmit: 'Não foi possível enviar. Revise o preço e os itens incluídos.',
    sentTitle: 'Orçamento recebido',
    sentBody: 'Obrigado. Analisaremos seu orçamento e entraremos em contato se for selecionado.',
  },
  es: {
    header: 'Cotización de turnover Airbnb',
    loading: 'Cargando…',
    unavailableTitle: 'Solicitud no disponible',
    unavailable: 'Esta solicitud no está disponible.',
    unavailableClosed: 'Esta solicitud no está disponible o la recepción de cotizaciones ya cerró.',
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    nextTurnover: 'Próximo turnover',
    listing: 'Ver anuncio en Airbnb',
    photos: 'Fotos',
    rule: 'Deje la propiedad lista para el próximo huésped. Si algo impide el trabajo, repórtelo en vez de marcarlo como terminado.',
    hostNotes: 'Notas del anfitrión',
    formTitle: 'Su cotización',
    formSub: 'Un precio total por turnover, todo incluido.',
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
    included: 'Incluido en su precio (marque los 8)',
    inclusions: {
      materials: 'Productos de limpieza',
      laundry: 'Lavandería (ropa de cama y toallas)',
      paper: 'Toallas de papel',
      toilet: 'Papel higiénico',
      trash: 'Bolsas de basura y retiro',
      kitchen: 'Detergente y artículos de cocina',
      bathroom: 'Jabón y artículos del baño',
      equipment: 'Equipos y transporte',
    },
    hours: 'Horas por turnover',
    insurance: '¿Seguro de responsabilidad civil?',
    sameDay: '¿Turnovers el mismo día?',
    yes: 'Sí',
    no: 'No',
    notes: 'Disponibilidad y notas',
    notesPlaceholder: 'Cuándo está disponible, experiencia, servicios especiales…',
    submit: 'Enviar cotización',
    confirmHelp: 'Marque los 8 artículos para enviar.',
    privacy: 'Su cotización es privada. Otras empresas no pueden verla.',
    errorAll: 'Marque los 8 artículos incluidos antes de enviar.',
    errorContact: 'Indique un email o teléfono.',
    errorSubmit: 'No pudimos enviar la cotización. Revise el precio y los artículos incluidos.',
    sentTitle: 'Cotización recibida',
    sentBody: 'Gracias. Revisaremos su cotización y le contactaremos si es seleccionado.',
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
    <div className="flex gap-1 text-xs font-bold">
      {(['en', 'pt', 'es'] as const).map(code => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-label={`Change language to ${code}`}
          className={`rounded-lg px-2.5 py-1.5 uppercase ${language === code ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          {code}
        </button>
      ))}
    </div>
  )

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <span className="text-sm font-black">XRankFlow</span>
        {languageSwitcher}
      </div>
      {children}
    </main>
  )

  if (loading) return shell(
    <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
      <Loader2 className="animate-spin" size={18}/>{t.loading}
    </div>
  )

  if (!request) return shell(
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <ShieldCheck className="mx-auto text-slate-400" size={36}/>
      <h1 className="mt-4 text-2xl font-black">{t.unavailableTitle}</h1>
      <p className="mt-2 text-slate-600">{errorKey ? t[errorKey] : t.unavailable}</p>
    </div>
  )

  if (sent) return shell(
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto text-emerald-600" size={48}/>
      <h1 className="mt-4 text-2xl font-black">{t.sentTitle}</h1>
      <p className="mt-2 text-slate-600">{t.sentBody}</p>
    </div>
  )

  const photos = request.photo_urls ?? []

  return shell(
    <div className="mx-auto max-w-3xl px-4 pb-16">
      {photos.length > 0 && (
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {photos.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className={`snap-start shrink-0 overflow-hidden rounded-2xl bg-slate-100 ${index === 0 ? 'w-[85%] sm:col-span-2 sm:row-span-2 sm:w-auto' : 'w-[60%] sm:w-auto'}`}
            >
              <img src={url} alt={`${t.photos} ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="aspect-[4/3] h-full w-full object-cover"/>
            </a>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{request.property_name}</h1>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <Fact label={t.bedrooms} value={String(request.bedrooms ?? '—')}/>
          <Fact label={t.bathrooms} value={String(request.bathrooms ?? '—')}/>
          <Fact
            label={t.nextTurnover}
            value={request.turnover_date ? new Date(request.turnover_date + 'T12:00:00').toLocaleDateString(dateLocales[language], { month: 'short', day: 'numeric' }) : 'TBD'}
          />
        </div>
        {request.airbnb_url && (
          <a href={request.airbnb_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 underline underline-offset-4">
            {t.listing}<ExternalLink size={14}/>
          </a>
        )}
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{t.rule}</p>
        {request.turnover_notes && (
          <div className="mt-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{t.hostNotes}</p>
            <p className="whitespace-pre-wrap">{request.turnover_notes}</p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-8">
        <h2 className="text-xl font-black">{t.formTitle}</h2>
        <p className="text-sm text-slate-500">{t.formSub}</p>

        {errorKey && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t[errorKey]}</p>}

        <div className={section}>
          <div>
            <p className={label}>{t.cleanerType}</p>
            <Segment<CleanerType>
              options={[['business', t.cleanerTypes.business], ['individual', t.cleanerTypes.individual]]}
              value={cleanerType}
              onChange={setCleanerType}
            />
          </div>
          <div>
            <label className={label} htmlFor="company">{t.company} *</label>
            <input id="company" className={input} required maxLength={160} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}/>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="email">{t.email}</label>
              <input id="email" type="email" className={input} maxLength={240} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
            </div>
            <div>
              <label className={label} htmlFor="phone">{t.phone}</label>
              <input id="phone" inputMode="tel" className={input} maxLength={80} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
            </div>
          </div>
          {!hasContact && <p className="-mt-2 text-xs text-amber-600">{t.contactHelp}</p>}
          <div>
            <label className={label} htmlFor="area">{t.serviceArea}</label>
            <input id="area" className={input} maxLength={160} value={form.service_area} onChange={e => setForm(f => ({ ...f, service_area: e.target.value }))}/>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="experience">{t.experience}</label>
              <input id="experience" type="number" min="0" max="80" inputMode="numeric" className={input} value={form.years_experience} onChange={e => setForm(f => ({ ...f, years_experience: e.target.value }))}/>
            </div>
            <div>
              <label className={label} htmlFor="team">{t.team}</label>
              <input id="team" type="number" min="1" max="50" inputMode="numeric" className={input} value={form.team_size} onChange={e => setForm(f => ({ ...f, team_size: e.target.value }))}/>
            </div>
          </div>
        </div>

        <div className={section}>
          <div>
            <label className={label} htmlFor="total">{t.total} *</label>
            <div className="flex items-center rounded-xl border border-slate-300 px-3.5 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10">
              <span className="text-xl font-black text-slate-500">$</span>
              <input id="total" required min="1" max="100000" step="0.01" type="number" inputMode="decimal" placeholder="0.00"
                className="w-full bg-transparent py-3 pl-1 text-2xl font-black outline-none"
                value={form.total_price} onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}/>
            </div>
          </div>

          <div>
            <p className={label}>{t.included}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {requiredKeys.map(key => (
                <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${checks[key] ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}>
                  <input type="checkbox" className="h-4 w-4 accent-white" checked={checks[key]} onChange={e => setChecks(c => ({ ...c, [key]: e.target.checked }))}/>
                  {t.inclusions[key]}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={section}>
          <div className="grid gap-4 sm:grid-cols-3">
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
        </div>

        <div className="mt-8">
          <button disabled={sending || !canSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-30">
            {sending && <Loader2 className="animate-spin" size={18}/>}
            {t.submit}
          </button>
          {!allIncluded && <p className="mt-2 text-center text-xs text-slate-500">{t.confirmHelp}</p>}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={14}/>{t.privacy}
          </p>
        </div>
      </form>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-black">{value}</p>
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
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition ${value === option ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}
        >
          {option === 'business' && <Building2 size={15}/>}
          {option === 'individual' && <User size={15}/>}
          {text}
        </button>
      ))}
    </div>
  )
}
