'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Camera, ClipboardCopy, ExternalLink, Loader2, Plus, RefreshCw, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type TurnoverRequest = {
  id: string
  public_token: string
  property_name: string
  property_address: string | null
  airbnb_url: string | null
  bedrooms: number | null
  bathrooms: number | null
  turnover_date: string | null
  turnover_notes: string | null
  photo_urls: string[]
  status: 'open' | 'closed' | 'awarded'
  created_at: string
}

type Quote = {
  id: string
  request_id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  total_price: number
  estimated_hours: number | null
  team_size: number | null
  availability_notes: string | null
  notes: string | null
  submitted_at: string
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500'
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500'

export default function TurnoverQuotesPage() {
  const [requests, setRequests] = useState<TurnoverRequest[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState({
    property_name: '',
    property_address: '',
    airbnb_url: '',
    bedrooms: '3',
    bathrooms: '2',
    turnover_date: '',
    turnover_notes: '',
  })

  const load = async () => {
    setLoading(true)
    const [requestRes, quoteRes] = await Promise.all([
      supabase.from('cleaning_turnover_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('cleaning_turnover_quotes').select('*').order('submitted_at', { ascending: false }),
    ])
    if (requestRes.error || quoteRes.error) {
      setMessage(requestRes.error?.message || quoteRes.error?.message || 'Unable to load turnover quotes.')
    } else {
      const nextRequests = (requestRes.data || []) as TurnoverRequest[]
      setRequests(nextRequests)
      setQuotes((quoteRes.data || []) as Quote[])
      setSelectedId(current => current || nextRequests[0]?.id || null)
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const selected = requests.find(r => r.id === selectedId) || null
  const selectedQuotes = useMemo(
    () => quotes.filter(q => q.request_id === selectedId).sort((a, b) => Number(a.total_price) - Number(b.total_price)),
    [quotes, selectedId]
  )

  const publicUrl = (request: TurnoverRequest) =>
    `${window.location.origin}/turnover-quote/${request.public_token}`

  const copyLink = async (request: TurnoverRequest) => {
    await navigator.clipboard.writeText(publicUrl(request))
    setMessage('Public quote link copied.')
  }

  const createRequest = async () => {
    setMessage(null)
    if (form.property_name.trim().length < 2) {
      setMessage('Add a property name.')
      return
    }

    setSaving(true)
    const { data: created, error } = await supabase
      .from('cleaning_turnover_requests')
      .insert({
        property_name: form.property_name.trim(),
        property_address: form.property_address.trim() || null,
        airbnb_url: form.airbnb_url.trim() || null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        turnover_date: form.turnover_date || null,
        turnover_notes: form.turnover_notes.trim() || null,
      })
      .select('*')
      .single()

    if (error || !created) {
      setMessage(error?.message || 'Could not create turnover request.')
      setSaving(false)
      return
    }

    const photoUrls: string[] = []
    for (const file of photos) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${created.id}/${crypto.randomUUID()}-${safe}`
      const upload = await supabase.storage.from('cleaning-turnover-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (upload.error) {
        setMessage(`Request created, but a photo failed to upload: ${upload.error.message}`)
        continue
      }
      const { data } = supabase.storage.from('cleaning-turnover-photos').getPublicUrl(path)
      if (data.publicUrl) photoUrls.push(data.publicUrl)
    }

    let finalRequest = created as TurnoverRequest
    if (photoUrls.length) {
      const updated = await supabase
        .from('cleaning_turnover_requests')
        .update({ photo_urls: photoUrls })
        .eq('id', created.id)
        .select('*')
        .single()
      if (!updated.error && updated.data) finalRequest = updated.data as TurnoverRequest
    }

    setRequests(current => [finalRequest, ...current])
    setSelectedId(finalRequest.id)
    setForm({ property_name: '', property_address: '', airbnb_url: '', bedrooms: '3', bathrooms: '2', turnover_date: '', turnover_notes: '' })
    setPhotos([])
    setMessage('Turnover request created. Copy the public link and send it to cleaning companies.')
    setSaving(false)
  }

  const setStatus = async (status: TurnoverRequest['status']) => {
    if (!selected) return
    const { error } = await supabase.from('cleaning_turnover_requests').update({ status }).eq('id', selected.id)
    if (error) {
      setMessage(error.message)
      return
    }
    setRequests(current => current.map(r => r.id === selected.id ? { ...r, status } : r))
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-10">
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">PROPERTY OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl">Airbnb Turnover Quotes</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Create one quote request, upload property photos, share a secure link, and compare cleaning-company bids.
          </p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={16}/> Refresh
        </button>
      </div>

      {message && <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Plus size={18}/>
            <h2 className="text-lg font-black">New turnover request</h2>
          </div>

          <div className="space-y-4">
            <div><label className={label}>Property name</label><input className={input} value={form.property_name} onChange={e => setForm(f => ({...f, property_name:e.target.value}))} placeholder="Dallas Airbnb - Oak Lawn"/></div>
            <div><label className={label}>Property address</label><input className={input} value={form.property_address} onChange={e => setForm(f => ({...f, property_address:e.target.value}))} placeholder="Address shown to invited cleaners"/></div>
            <div><label className={label}>Airbnb listing URL</label><input className={input} type="url" value={form.airbnb_url} onChange={e => setForm(f => ({...f, airbnb_url:e.target.value}))} placeholder="https://www.airbnb.com/rooms/..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Bedrooms</label><input className={input} type="number" min="0" step="0.5" value={form.bedrooms} onChange={e => setForm(f => ({...f, bedrooms:e.target.value}))}/></div>
              <div><label className={label}>Bathrooms</label><input className={input} type="number" min="0" step="0.5" value={form.bathrooms} onChange={e => setForm(f => ({...f, bathrooms:e.target.value}))}/></div>
            </div>
            <div><label className={label}>Next turnover date</label><input className={input} type="date" value={form.turnover_date} onChange={e => setForm(f => ({...f, turnover_date:e.target.value}))}/></div>
            <div><label className={label}>Instructions</label><textarea className={input} rows={4} value={form.turnover_notes} onChange={e => setForm(f => ({...f, turnover_notes:e.target.value}))} placeholder="Special instructions, access notes, bed setup, etc."/></div>
            <div>
              <label className={label}>Property photos</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-700">
                <Camera size={18}/>
                {photos.length ? `${photos.length} photo(s) selected` : 'Choose photos'}
                <input className="hidden" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files || []))}/>
              </label>
              <p className="mt-2 text-xs text-slate-400">Up to 8 MB per photo.</p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-black tracking-wider text-slate-400">MANDATORY ALL-IN PRICE</p>
              <p className="mt-2 text-sm font-semibold">Every quote must include:</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
                <span>✓ Cleaning materials</span><span>✓ Laundry</span>
                <span>✓ Paper towels</span><span>✓ Toilet paper</span>
              </div>
            </div>

            <button disabled={saving} onClick={() => void createRequest()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              {saving ? <Loader2 size={17} className="animate-spin"/> : <Sparkles size={17}/>}
              Create quote request
            </button>
          </div>
        </section>

        <section className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-wider text-slate-500">REQUESTS</p>
                <h2 className="text-xl font-black">{requests.length} turnover request{requests.length === 1 ? '' : 's'}</h2>
              </div>
            </div>

            {loading ? <div className="py-10 text-center text-sm text-slate-500">Loading…</div> : requests.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Create your first turnover quote request.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {requests.map(request => {
                  const count = quotes.filter(q => q.request_id === request.id).length
                  return (
                    <button key={request.id} onClick={() => setSelectedId(request.id)} className={`rounded-xl border p-4 text-left transition ${selectedId === request.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-black">{request.property_name}</p><p className="mt-1 text-xs text-slate-500">{request.property_address || 'No address set'}</p></div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase">{request.status}</span>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs text-slate-500">
                        <span>{request.bedrooms ?? '—'} bed</span><span>{request.bathrooms ?? '—'} bath</span><span className="font-bold text-slate-800">{count} quote{count === 1 ? '' : 's'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selected && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black tracking-wider text-slate-500">SELECTED PROPERTY</p>
                    <h2 className="mt-1 text-2xl font-black">{selected.property_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selected.property_address || 'No address set'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void copyLink(selected)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"><ClipboardCopy size={16}/> Copy public link</button>
                    <a href={publicUrl(selected)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold"><ExternalLink size={16}/> Open quote page</a>
                    {selected.airbnb_url && <a href={selected.airbnb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold"><ExternalLink size={16}/> Open Airbnb listing</a>}
                  </div>
                </div>

                {selected.photo_urls?.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
                    {selected.photo_urls.map((url, i) => <img key={url} src={url} alt={`Property photo ${i + 1}`} className="aspect-square w-full rounded-xl object-cover"/>)}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => void setStatus('open')} className="rounded-lg border px-3 py-2 text-xs font-bold">Open</button>
                  <button onClick={() => void setStatus('closed')} className="rounded-lg border px-3 py-2 text-xs font-bold">Close bidding</button>
                  <button onClick={() => void setStatus('awarded')} className="rounded-lg border px-3 py-2 text-xs font-bold">Mark awarded</button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-wider text-slate-500">BID COMPARISON</p>
                    <h2 className="text-xl font-black">Cleaning company quotes</h2>
                  </div>
                  <span className="text-sm font-bold text-slate-500">{selectedQuotes.length} received</span>
                </div>

                {selectedQuotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No quotes yet. Share the public link with cleaning companies.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedQuotes.map((quote, index) => (
                      <div key={quote.id} className={`rounded-xl border p-4 ${index === 0 ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black">{quote.company_name}</p>
                              {index === 0 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">LOWEST BID</span>}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{quote.contact_name || 'No contact name'} · {quote.email || quote.phone || 'No contact'}</p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-3xl font-black text-slate-950">${Number(quote.total_price).toFixed(2)}</p>
                            <p className="text-xs font-bold text-emerald-700">All required supplies included</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-4">
                          <span className="rounded-lg bg-white p-2">✓ Materials</span>
                          <span className="rounded-lg bg-white p-2">✓ Laundry</span>
                          <span className="rounded-lg bg-white p-2">✓ Paper towels</span>
                          <span className="rounded-lg bg-white p-2">✓ Toilet paper</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          {quote.estimated_hours && <span>{quote.estimated_hours} estimated hours</span>}
                          {quote.team_size && <span>{quote.team_size} cleaner{quote.team_size === 1 ? '' : 's'}</span>}
                          <span>Submitted {new Date(quote.submitted_at).toLocaleString()}</span>
                        </div>
                        {quote.availability_notes && <p className="mt-3 text-sm text-slate-700"><b>Availability:</b> {quote.availability_notes}</p>}
                        {quote.notes && <p className="mt-2 text-sm text-slate-700"><b>Notes:</b> {quote.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
