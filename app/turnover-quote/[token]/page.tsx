'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, CheckCircle2, Home, Loader2, ShieldCheck } from 'lucide-react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PublicRequest = {
  id: string
  property_name: string
  property_address: string | null
  bedrooms: number | null
  bathrooms: number | null
  turnover_date: string | null
  turnover_notes: string | null
  photo_urls: string[]
  status: string
}

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500'
const label = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500'

export default function PublicTurnoverQuotePage() {
  const params = useParams<{ token: string }>()
  const token = params?.token
  const [request, setRequest] = useState<PublicRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState({ materials: false, laundry: false, paper: false, toilet: false })
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', total_price: '',
    estimated_hours: '', team_size: '', availability_notes: '', notes: ''
  })

  useEffect(() => {
    const load = async () => {
      if (!token) return
      const { data, error } = await supabase.rpc('cleaning_turnover_public_request', { p_token: token })
      if (error || !data) setError('This quote request is unavailable or bidding has closed.')
      else setRequest(data as PublicRequest)
      setLoading(false)
    }
    void load()
  }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!checks.materials || !checks.laundry || !checks.paper || !checks.toilet) {
      setError('The total price must include all required items before you can submit.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Please provide an email or phone number.')
      return
    }

    setSending(true)
    const { error } = await supabase.rpc('submit_cleaning_turnover_quote', {
      p_token: token,
      p_company_name: form.company_name.trim(),
      p_contact_name: form.contact_name.trim() || null,
      p_email: form.email.trim() || null,
      p_phone: form.phone.trim() || null,
      p_total_price: Number(form.total_price),
      p_includes_cleaning_supplies: checks.materials,
      p_includes_laundry: checks.laundry,
      p_includes_paper_towels: checks.paper,
      p_includes_toilet_paper: checks.toilet,
      p_estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      p_team_size: form.team_size ? Number(form.team_size) : null,
      p_availability_notes: form.availability_notes.trim() || null,
      p_notes: form.notes.trim() || null,
    })

    if (error) {
      if (error.message.includes('all_required_inclusions')) setError('All required items must be included in the total price.')
      else if (error.message.includes('contact_required')) setError('Please provide an email or phone number.')
      else setError('We could not submit the quote. Please review the form and try again.')
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-24 max-w-xl text-center text-slate-500"><Loader2 className="mx-auto mb-3 animate-spin"/>Loading quote request…</div></main>
  if (!request) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mt-24 max-w-xl rounded-2xl border bg-white p-8 text-center"><h1 className="text-2xl font-black">Quote request unavailable</h1><p className="mt-2 text-slate-500">{error}</p></div></main>

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={50} className="mx-auto text-emerald-600"/>
          <h1 className="mt-4 text-3xl font-black">Quote submitted</h1>
          <p className="mt-2 text-slate-500">Thank you. Your all-inclusive turnover quote has been received.</p>
        </div>
      </main>
    )
  }

  const allIncluded = checks.materials && checks.laundry && checks.paper && checks.toilet

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-black text-white">XR</div>
          <div><p className="text-sm font-black">Turnover Quote Request</p><p className="text-xs text-slate-500">Property cleaning bid</p></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_440px]">
        <section className="space-y-5">
          <div className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
            <div className="flex items-center gap-2 text-xs font-black tracking-[0.18em] text-slate-400"><Home size={15}/> AIRBNB TURNOVER</div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">{request.property_name}</h1>
            {request.property_address && <p className="mt-2 text-slate-300">{request.property_address}</p>}
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1.5">{request.bedrooms ?? '—'} bedrooms</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">{request.bathrooms ?? '—'} bathrooms</span>
              {request.turnover_date && <span className="rounded-full bg-white/10 px-3 py-1.5">Next turnover: {new Date(request.turnover_date + 'T12:00:00').toLocaleDateString()}</span>}
            </div>
          </div>

          {request.photo_urls?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {request.photo_urls.map((url, index) => <img key={url} src={url} alt={`Property photo ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover"/>)}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black">Turnover scope</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.turnover_notes || 'Standard Airbnb turnover cleaning. Please review the property photos and submit your complete all-inclusive price.'}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black tracking-wider text-amber-800">IMPORTANT PRICING REQUIREMENT</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Submit one total price with supplies included.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Do not submit a base cleaning price and add these charges later. Your total must already include all items below.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {['Cleaning supplies and materials','Laundry','Paper towels','Toilet paper'].map(item => <div key={item} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold"><Check size={16} className="text-emerald-600"/>{item}</div>)}
            </div>
          </div>
        </section>

        <aside>
          <form onSubmit={submit} className="sticky top-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-slate-500"><ShieldCheck size={15}/> CLEANING COMPANY BID</div>
              <h2 className="mt-1 text-2xl font-black">Submit your quote</h2>
            </div>

            {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

            <div className="space-y-4">
              <div><label className={label}>Company name *</label><input className={field} required value={form.company_name} onChange={e => setForm(f => ({...f, company_name:e.target.value}))}/></div>
              <div><label className={label}>Contact name</label><input className={field} value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Email</label><input className={field} type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))}/></div>
                <div><label className={label}>Phone</label><input className={field} value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}/></div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">All-inclusive total price *</label>
                <div className="flex items-center gap-2"><span className="text-2xl font-black">$</span><input className="w-full bg-transparent text-3xl font-black outline-none placeholder:text-slate-600" required min="1" max="100000" step="0.01" type="number" placeholder="0.00" value={form.total_price} onChange={e => setForm(f => ({...f, total_price:e.target.value}))}/></div>
              </div>

              <div>
                <p className={label}>Confirm this total includes *</p>
                <div className="space-y-2">
                  <CheckBox checked={checks.materials} onChange={v => setChecks(c => ({...c, materials:v}))} label="Cleaning supplies and materials"/>
                  <CheckBox checked={checks.laundry} onChange={v => setChecks(c => ({...c, laundry:v}))} label="Laundry"/>
                  <CheckBox checked={checks.paper} onChange={v => setChecks(c => ({...c, paper:v}))} label="Paper towels"/>
                  <CheckBox checked={checks.toilet} onChange={v => setChecks(c => ({...c, toilet:v}))} label="Toilet paper"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Estimated hours</label><input className={field} min="0.5" step="0.5" type="number" value={form.estimated_hours} onChange={e => setForm(f => ({...f, estimated_hours:e.target.value}))}/></div>
                <div><label className={label}>Team size</label><input className={field} min="1" max="50" type="number" value={form.team_size} onChange={e => setForm(f => ({...f, team_size:e.target.value}))}/></div>
              </div>
              <div><label className={label}>Availability</label><textarea className={field} rows={2} value={form.availability_notes} onChange={e => setForm(f => ({...f, availability_notes:e.target.value}))} placeholder="Days/times you can handle turnovers"/></div>
              <div><label className={label}>Notes</label><textarea className={field} rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder="Anything else we should know"/></div>

              <button disabled={sending || !allIncluded} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? <Loader2 size={17} className="animate-spin"/> : <CheckCircle2 size={17}/>}
                Submit all-inclusive quote
              </button>
              {!allIncluded && <p className="text-center text-xs text-slate-400">Confirm all four included items to enable submission.</p>}
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
