'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle2, ExternalLink, Home, Loader2, ShieldCheck } from 'lucide-react'
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

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500'
const label = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500'

const copy = {
  en: {
    language: 'Language',
    header: 'Turnover Quote Request',
    headerSub: 'Property cleaning bid',
    loading: 'Loading quote request…',
    unavailableTitle: 'Quote request unavailable',
    unavailable: 'This quote request is unavailable.',
    unavailableClosed: 'This quote request is unavailable or bidding has closed.',
    turnover: 'AIRBNB TURNOVER',
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    nextTurnover: 'Next turnover',
    viewListing: 'View Airbnb listing',
    photosAlt: 'Property photo',
    scope: 'Turnover scope',
    defaultScope: 'Standard Airbnb turnover cleaning. Please review the property photos and submit your complete all-inclusive price.',
    pricingEyebrow: 'IMPORTANT PRICING REQUIREMENT',
    pricingTitle: 'Submit one total price with supplies included.',
    pricingBody: 'Do not submit a base cleaning price and add these charges later. Your total must already include all items below.',
    materials: 'Cleaning supplies and materials',
    laundry: 'Laundry',
    paperTowels: 'Paper towels',
    toiletPaper: 'Toilet paper',
    bidEyebrow: 'CLEANING COMPANY BID',
    bidTitle: 'Submit your quote',
    company: 'Company name',
    contact: 'Contact name',
    email: 'Email',
    phone: 'Phone',
    total: 'All-inclusive total price',
    confirm: 'Confirm this total includes',
    hours: 'Estimated hours',
    team: 'Team size',
    availability: 'Availability',
    availabilityPlaceholder: 'Days/times you can handle turnovers',
    notes: 'Notes',
    notesPlaceholder: 'Anything else we should know',
    submit: 'Submit all-inclusive quote',
    confirmHelp: 'Confirm all four included items to enable submission.',
    errorAll: 'The total price must include all required items before you can submit.',
    errorContact: 'Please provide an email or phone number.',
    errorSubmit: 'We could not submit the quote. Please review the total price, contact information, and included items.',
    sentTitle: 'Quote submitted',
    sentBody: 'Thank you. Your all-inclusive turnover quote has been received.',
  },
  pt: {
    language: 'Idioma',
    header: 'Solicitação de Orçamento de Turnover',
    headerSub: 'Orçamento de limpeza do imóvel',
    loading: 'Carregando solicitação…',
    unavailableTitle: 'Solicitação indisponível',
    unavailable: 'Esta solicitação de orçamento não está disponível.',
    unavailableClosed: 'Esta solicitação não está disponível ou o período de orçamentos foi encerrado.',
    turnover: 'TURNOVER DO AIRBNB',
    bedrooms: 'quartos',
    bathrooms: 'banheiros',
    nextTurnover: 'Próximo turnover',
    viewListing: 'Ver anúncio no Airbnb',
    photosAlt: 'Foto do imóvel',
    scope: 'Escopo do turnover',
    defaultScope: 'Limpeza completa de turnover para Airbnb. Revise as fotos do imóvel e envie um preço total com tudo incluído.',
    pricingEyebrow: 'REQUISITO IMPORTANTE DE PREÇO',
    pricingTitle: 'Envie um único preço total com os suprimentos incluídos.',
    pricingBody: 'Não envie um preço básico de limpeza para acrescentar cobranças depois. O valor total deve incluir todos os itens abaixo.',
    materials: 'Produtos e materiais de limpeza',
    laundry: 'Lavanderia',
    paperTowels: 'Papel-toalha',
    toiletPaper: 'Papel higiênico',
    bidEyebrow: 'ORÇAMENTO DA EMPRESA DE LIMPEZA',
    bidTitle: 'Enviar orçamento',
    company: 'Nome da empresa',
    contact: 'Nome do contato',
    email: 'Email',
    phone: 'Telefone',
    total: 'Preço total com tudo incluído',
    confirm: 'Confirme que o valor total inclui',
    hours: 'Horas estimadas',
    team: 'Tamanho da equipe',
    availability: 'Disponibilidade',
    availabilityPlaceholder: 'Dias/horários em que você pode fazer os turnovers',
    notes: 'Observações',
    notesPlaceholder: 'Algo mais que devemos saber',
    submit: 'Enviar orçamento completo',
    confirmHelp: 'Confirme os quatro itens incluídos para liberar o envio.',
    errorAll: 'O preço total deve incluir todos os itens obrigatórios antes do envio.',
    errorContact: 'Informe um email ou telefone.',
    errorSubmit: 'Não foi possível enviar o orçamento. Revise o preço total, contato e itens incluídos.',
    sentTitle: 'Orçamento enviado',
    sentBody: 'Obrigado. Seu orçamento completo para o turnover foi recebido.',
  },
  es: {
    language: 'Idioma',
    header: 'Solicitud de Cotización de Turnover',
    headerSub: 'Cotización de limpieza de la propiedad',
    loading: 'Cargando solicitud…',
    unavailableTitle: 'Solicitud no disponible',
    unavailable: 'Esta solicitud de cotización no está disponible.',
    unavailableClosed: 'Esta solicitud no está disponible o la recepción de cotizaciones ya cerró.',
    turnover: 'TURNOVER DE AIRBNB',
    bedrooms: 'habitaciones',
    bathrooms: 'baños',
    nextTurnover: 'Próximo turnover',
    viewListing: 'Ver anuncio en Airbnb',
    photosAlt: 'Foto de la propiedad',
    scope: 'Alcance del turnover',
    defaultScope: 'Limpieza completa de turnover para Airbnb. Revise las fotos de la propiedad y envíe un precio total con todo incluido.',
    pricingEyebrow: 'REQUISITO IMPORTANTE DE PRECIO',
    pricingTitle: 'Envíe un único precio total con los suministros incluidos.',
    pricingBody: 'No envíe un precio básico de limpieza para agregar cargos después. El total debe incluir todos los artículos de abajo.',
    materials: 'Productos y materiales de limpieza',
    laundry: 'Lavandería',
    paperTowels: 'Toallas de papel',
    toiletPaper: 'Papel higiénico',
    bidEyebrow: 'COTIZACIÓN DE LA EMPRESA DE LIMPIEZA',
    bidTitle: 'Enviar cotización',
    company: 'Nombre de la empresa',
    contact: 'Nombre de contacto',
    email: 'Email',
    phone: 'Teléfono',
    total: 'Precio total con todo incluido',
    confirm: 'Confirme que este total incluye',
    hours: 'Horas estimadas',
    team: 'Tamaño del equipo',
    availability: 'Disponibilidad',
    availabilityPlaceholder: 'Días/horarios en que puede realizar turnovers',
    notes: 'Notas',
    notesPlaceholder: 'Cualquier otra información que debamos saber',
    submit: 'Enviar cotización completa',
    confirmHelp: 'Confirme los cuatro artículos incluidos para habilitar el envío.',
    errorAll: 'El precio total debe incluir todos los artículos obligatorios antes de enviar.',
    errorContact: 'Proporcione un email o teléfono.',
    errorSubmit: 'No pudimos enviar la cotización. Revise el precio total, el contacto y los artículos incluidos.',
    sentTitle: 'Cotización enviada',
    sentBody: 'Gracias. Recibimos su cotización completa para el turnover.',
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
  const [checks, setChecks] = useState({ materials: false, laundry: false, paper: false, toilet: false })
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
    if (!checks.materials || !checks.laundry || !checks.paper || !checks.toilet) {
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
        includes_cleaning_supplies: checks.materials,
        includes_laundry: checks.laundry,
        includes_paper_towels: checks.paper,
        includes_toilet_paper: checks.toilet,
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
  }

  const languageSwitcher = (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      {([
        ['en', 'English'],
        ['pt', 'Português'],
        ['es', 'Español'],
      ] as const).map(([code, name]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${language === code ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {name}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl justify-end">{languageSwitcher}</div>
      <div className="mx-auto mt-24 max-w-xl text-center text-slate-500"><Loader2 className="mx-auto mb-3 animate-spin"/>{t.loading}</div>
    </main>
  )

  if (!request) return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl justify-end">{languageSwitcher}</div>
      <div className="mx-auto mt-24 max-w-xl rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-2xl font-black">{t.unavailableTitle}</h1>
        <p className="mt-2 text-slate-500">{errorKey ? t[errorKey] : t.unavailable}</p>
      </div>
    </main>
  )

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex max-w-6xl justify-end">{languageSwitcher}</div>
        <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={50} className="mx-auto text-emerald-600"/>
          <h1 className="mt-4 text-3xl font-black">{t.sentTitle}</h1>
          <p className="mt-2 text-slate-500">{t.sentBody}</p>
        </div>
      </main>
    )
  }

  const allIncluded = checks.materials && checks.laundry && checks.paper && checks.toilet

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-black text-white">XR</div>
            <div><p className="text-sm font-black">{t.header}</p><p className="text-xs text-slate-500">{t.headerSub}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-slate-500 sm:inline">{t.language}</span>
            {languageSwitcher}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_440px]">
        <section className="space-y-5">
          <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
            <div className="flex items-center gap-2 text-xs font-black tracking-[0.18em] text-slate-400"><Home size={15}/> {t.turnover}</div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{request.property_name}</h1>
            {request.property_address && <p className="mt-2 text-slate-300">{request.property_address}</p>}
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1.5">{request.bedrooms ?? '—'} {t.bedrooms}</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{request.bathrooms ?? '—'} {t.bathrooms}</span>
              {request.turnover_date && <span className="rounded-full bg-white/10 px-3 py-1.5">{t.nextTurnover}: {new Date(request.turnover_date + 'T12:00:00').toLocaleDateString(dateLocales[language])}</span>}
            </div>
            {request.airbnb_url && (
              <a href={request.airbnb_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">
                <ExternalLink size={16}/> {t.viewListing}
              </a>
            )}
          </div>

          {request.photo_urls?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {request.photo_urls.map((url, index) => <img key={url} src={url} alt={`${t.photosAlt} ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover"/>)}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">{t.scope}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.turnover_notes || t.defaultScope}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black tracking-wider text-amber-800">{t.pricingEyebrow}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{t.pricingTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{t.pricingBody}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[t.materials, t.laundry, t.paperTowels, t.toiletPaper].map(item => <div key={item} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><Check size={16} className="text-emerald-600"/>{item}</div>)}
            </div>
          </div>
        </section>

        <aside>
          <form onSubmit={submit} className="sticky top-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-slate-500"><ShieldCheck size={15}/> {t.bidEyebrow}</div>
              <h2 className="mt-1 text-2xl font-black">{t.bidTitle}</h2>
            </div>

            {errorKey && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t[errorKey]}</div>}

            <div className="space-y-4">
              <div><label className={label}>{t.company} *</label><input className={field} required maxLength={160} value={form.company_name} onChange={e => setForm(f => ({...f, company_name:e.target.value}))}/></div>
              <div><label className={label}>{t.contact}</label><input className={field} maxLength={160} value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>{t.email}</label><input className={field} type="email" maxLength={240} value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}/></div>
                <div><label className={label}>{t.phone}</label><input className={field} maxLength={80} value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}/></div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">{t.total} *</label>
                <div className="flex items-center gap-2"><span className="text-2xl font-black">$</span><input className="w-full bg-transparent text-3xl font-black outline-none placeholder:text-slate-600" required min="1" max="100000" step="0.01" type="number" placeholder="0.00" value={form.total_price} onChange={e => setForm(f => ({...f, total_price:e.target.value}))}/></div>
              </div>

              <div>
                <p className={label}>{t.confirm} *</p>
                <div className="space-y-2">
                  <CheckBox checked={checks.materials} onChange={v => setChecks(c => ({...c, materials:v}))} label={t.materials}/>
                  <CheckBox checked={checks.laundry} onChange={v => setChecks(c => ({...c, laundry:v}))} label={t.laundry}/>
                  <CheckBox checked={checks.paper} onChange={v => setChecks(c => ({...c, paper:v}))} label={t.paperTowels}/>
                  <CheckBox checked={checks.toilet} onChange={v => setChecks(c => ({...c, toilet:v}))} label={t.toiletPaper}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>{t.hours}</label><input className={field} min="0.5" max="168" step="0.5" type="number" value={form.estimated_hours} onChange={e => setForm(f => ({...f, estimated_hours:e.target.value}))}/></div>
                <div><label className={label}>{t.team}</label><input className={field} min="1" max="50" type="number" value={form.team_size} onChange={e => setForm(f => ({...f, team_size:e.target.value}))}/></div>
              </div>
              <div><label className={label}>{t.availability}</label><textarea className={field} maxLength={1200} rows={2} value={form.availability_notes} onChange={e => setForm(f => ({...f, availability_notes:e.target.value}))} placeholder={t.availabilityPlaceholder}/></div>
              <div><label className={label}>{t.notes}</label><textarea className={field} maxLength={3000} rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder={t.notesPlaceholder}/></div>

              <button disabled={sending || !allIncluded} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? <Loader2 size={17} className="animate-spin"/> : <CheckCircle2 size={17}/>}
                {t.submit}
              </button>
              {!allIncluded && <p className="text-center text-xs text-slate-400">{t.confirmHelp}</p>}
            </div>
          </form>
        </aside>
      </div>
    </main>
  )
}

function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: (value:boolean) => void; label: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span>{label}</span>
    </label>
  )
}
