'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Banknote, CalendarDays, Camera, ClipboardCopy, ExternalLink,
  Loader2, Mail, MessageSquare, Plus, RefreshCw, Sparkles, Users, Wrench
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Tab = 'quotes' | 'reservations' | 'turnovers' | 'messages' | 'payments' | 'vendors'

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
  awarded_quote_id: string | null
  awarded_vendor_id: string | null
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

type Vendor = {
  id: string
  source_quote_id: string | null
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  preferred_language: 'en' | 'pt' | 'es'
  status: 'prospect' | 'active' | 'inactive'
  default_rate: number | null
  payment_method: string | null
  notes: string | null
  created_at: string
}

type Reservation = {
  id: string
  request_id: string
  reservation_code: string | null
  guest_name: string | null
  guest_count: number | null
  check_in_at: string
  check_out_at: string
  status: 'booked' | 'canceled' | 'completed'
  notes: string | null
  created_at: string
}

type Turnover = {
  id: string
  request_id: string
  reservation_id: string | null
  vendor_id: string | null
  source_quote_id: string | null
  scheduled_for: string
  checkout_at: string | null
  next_checkin_at: string | null
  status: 'planned' | 'assigned' | 'confirmed' | 'in_progress' | 'awaiting_review' | 'completed' | 'canceled'
  agreed_price: number | null
  instructions: string | null
  completion_notes: string | null
  final_photo_urls: string[]
  completed_at: string | null
  created_at: string
}

type TurnoverMessage = {
  id: string
  turnover_id: string
  vendor_id: string | null
  direction: 'outbound' | 'inbound' | 'internal'
  channel: 'portal' | 'email' | 'sms' | 'phone' | 'other'
  recipient: string | null
  body: string
  status: 'draft' | 'queued' | 'logged' | 'sent' | 'delivered' | 'failed'
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
}

type Payment = {
  id: string
  turnover_id: string
  vendor_id: string | null
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'hold' | 'void' | 'refunded'
  method: string | null
  reference: string | null
  due_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500'
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500'
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

export default function TurnoverOperationsPage() {
  const [tab, setTab] = useState<Tab>('quotes')
  const [requests, setRequests] = useState<TurnoverRequest[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [turnovers, setTurnovers] = useState<Turnover[]>([])
  const [messages, setMessages] = useState<TurnoverMessage[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [quoteForm, setQuoteForm] = useState({
    property_name: '',
    property_address: '',
    airbnb_url: '',
    bedrooms: '3',
    bathrooms: '2',
    turnover_date: '',
    turnover_notes: '',
  })
  const [reservationForm, setReservationForm] = useState({
    reservation_code: '',
    guest_name: '',
    guest_count: '',
    check_in_at: '',
    check_out_at: '',
    notes: '',
  })
  const [messageForm, setMessageForm] = useState({
    turnover_id: '',
    channel: 'email' as TurnoverMessage['channel'],
    body: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    turnover_id: '',
    amount: '',
    due_at: '',
    method: '',
    notes: '',
  })

  const load = async () => {
    setLoading(true)
    setMessage(null)
    const results = await Promise.all([
      supabase.from('cleaning_turnover_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('cleaning_turnover_quotes').select('*').order('submitted_at', { ascending: false }),
      supabase.from('cleaning_vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('airbnb_reservations').select('*').order('check_out_at', { ascending: false }),
      supabase.from('airbnb_turnovers').select('*').order('scheduled_for', { ascending: false }),
      supabase.from('airbnb_turnover_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('airbnb_turnover_payments').select('*').order('created_at', { ascending: false }),
    ])

    const firstError = results.find(result => result.error)?.error
    if (firstError) {
      setMessage(firstError.message)
    } else {
      const nextRequests = (results[0].data || []) as TurnoverRequest[]
      setRequests(nextRequests)
      setQuotes((results[1].data || []) as Quote[])
      setVendors((results[2].data || []) as Vendor[])
      setReservations((results[3].data || []) as Reservation[])
      setTurnovers((results[4].data || []) as Turnover[])
      setMessages((results[5].data || []) as TurnoverMessage[])
      setPayments((results[6].data || []) as Payment[])
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
  const selectedReservations = useMemo(
    () => reservations.filter(r => r.request_id === selectedId).sort((a, b) => +new Date(b.check_out_at) - +new Date(a.check_out_at)),
    [reservations, selectedId]
  )
  const selectedTurnovers = useMemo(
    () => turnovers.filter(t => t.request_id === selectedId).sort((a, b) => +new Date(b.scheduled_for) - +new Date(a.scheduled_for)),
    [turnovers, selectedId]
  )
  const selectedTurnoverIds = useMemo(() => new Set(selectedTurnovers.map(t => t.id)), [selectedTurnovers])
  const selectedMessages = useMemo(
    () => messages.filter(m => selectedTurnoverIds.has(m.turnover_id)),
    [messages, selectedTurnoverIds]
  )
  const selectedPayments = useMemo(
    () => payments.filter(p => selectedTurnoverIds.has(p.turnover_id)),
    [payments, selectedTurnoverIds]
  )

  const awardedVendor = selected?.awarded_vendor_id
    ? vendors.find(v => v.id === selected.awarded_vendor_id) || null
    : null
  const awardedQuote = selected?.awarded_quote_id
    ? quotes.find(q => q.id === selected.awarded_quote_id) || null
    : null

  const publicUrl = (request: TurnoverRequest) =>
    `${window.location.origin}/turnover-quote/${request.public_token}`

  const copyLink = async (request: TurnoverRequest) => {
    await navigator.clipboard.writeText(publicUrl(request))
    setMessage('Public quote link copied.')
  }

  const createRequest = async () => {
    if (quoteForm.property_name.trim().length < 2) {
      setMessage('Add a property name.')
      return
    }

    setSaving(true)
    setMessage(null)
    const { data: created, error } = await supabase
      .from('cleaning_turnover_requests')
      .insert({
        property_name: quoteForm.property_name.trim(),
        property_address: quoteForm.property_address.trim() || null,
        airbnb_url: quoteForm.airbnb_url.trim() || null,
        bedrooms: quoteForm.bedrooms ? Number(quoteForm.bedrooms) : null,
        bathrooms: quoteForm.bathrooms ? Number(quoteForm.bathrooms) : null,
        turnover_date: quoteForm.turnover_date || null,
        turnover_notes: quoteForm.turnover_notes.trim() || null,
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
      if (!upload.error) {
        const { data } = supabase.storage.from('cleaning-turnover-photos').getPublicUrl(path)
        if (data.publicUrl) photoUrls.push(data.publicUrl)
      }
    }

    if (photoUrls.length) {
      await supabase
        .from('cleaning_turnover_requests')
        .update({ photo_urls: photoUrls })
        .eq('id', created.id)
    }

    setQuoteForm({ property_name: '', property_address: '', airbnb_url: '', bedrooms: '3', bathrooms: '2', turnover_date: '', turnover_notes: '' })
    setPhotos([])
    setMessage('Quote request created.')
    setSaving(false)
    await load()
    setSelectedId(created.id)
  }

  const awardQuote = async (quote: Quote) => {
    if (!selected) return
    setSaving(true)
    setMessage(null)

    let vendor = vendors.find(v => v.source_quote_id === quote.id) || null
    if (!vendor) {
      const inserted = await supabase
        .from('cleaning_vendors')
        .insert({
          source_quote_id: quote.id,
          company_name: quote.company_name,
          contact_name: quote.contact_name,
          email: quote.email,
          phone: quote.phone,
          status: 'active',
          default_rate: Number(quote.total_price),
        })
        .select('*')
        .single()

      if (inserted.error || !inserted.data) {
        setMessage(inserted.error?.message || 'Could not create vendor.')
        setSaving(false)
        return
      }
      vendor = inserted.data as Vendor
    }

    const updated = await supabase
      .from('cleaning_turnover_requests')
      .update({
        status: 'awarded',
        awarded_quote_id: quote.id,
        awarded_vendor_id: vendor.id,
      })
      .eq('id', selected.id)

    if (updated.error) {
      setMessage(updated.error.message)
    } else {
      setMessage(`${quote.company_name} is now the selected cleaner for this property.`)
      await load()
    }
    setSaving(false)
  }

  const reopenBidding = async () => {
    if (!selected) return
    const { error } = await supabase
      .from('cleaning_turnover_requests')
      .update({ status: 'open', awarded_quote_id: null, awarded_vendor_id: null })
      .eq('id', selected.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Bidding reopened.')
      await load()
    }
  }

  const createReservation = async () => {
    if (!selected || !reservationForm.check_in_at || !reservationForm.check_out_at) {
      setMessage('Check-in and check-out are required.')
      return
    }

    const checkIn = new Date(reservationForm.check_in_at)
    const checkOut = new Date(reservationForm.check_out_at)
    if (checkOut <= checkIn) {
      setMessage('Check-out must be after check-in.')
      return
    }

    setSaving(true)
    const reservationInsert = await supabase
      .from('airbnb_reservations')
      .insert({
        request_id: selected.id,
        reservation_code: reservationForm.reservation_code.trim() || null,
        guest_name: reservationForm.guest_name.trim() || null,
        guest_count: reservationForm.guest_count ? Number(reservationForm.guest_count) : null,
        check_in_at: checkIn.toISOString(),
        check_out_at: checkOut.toISOString(),
        status: 'booked',
        notes: reservationForm.notes.trim() || null,
      })
      .select('*')
      .single()

    if (reservationInsert.error || !reservationInsert.data) {
      setMessage(reservationInsert.error?.message || 'Could not create reservation.')
      setSaving(false)
      return
    }

    const turnoverInsert = await supabase
      .from('airbnb_turnovers')
      .insert({
        request_id: selected.id,
        reservation_id: reservationInsert.data.id,
        vendor_id: selected.awarded_vendor_id,
        source_quote_id: selected.awarded_quote_id,
        scheduled_for: checkOut.toISOString(),
        checkout_at: checkOut.toISOString(),
        status: selected.awarded_vendor_id ? 'assigned' : 'planned',
        agreed_price: awardedQuote ? Number(awardedQuote.total_price) : null,
        instructions: selected.turnover_notes,
      })
      .select('*')
      .single()

    if (turnoverInsert.error) {
      setMessage(`Reservation created, but turnover creation failed: ${turnoverInsert.error.message}`)
    } else {
      setMessage('Reservation and turnover created.')
      setReservationForm({ reservation_code: '', guest_name: '', guest_count: '', check_in_at: '', check_out_at: '', notes: '' })
      await load()
      if (turnoverInsert.data) {
        setMessageForm(form => ({ ...form, turnover_id: turnoverInsert.data.id }))
        setPaymentForm(form => ({
          ...form,
          turnover_id: turnoverInsert.data.id,
          amount: awardedQuote ? String(Number(awardedQuote.total_price).toFixed(2)) : '',
        }))
      }
    }
    setSaving(false)
  }

  const updateTurnoverStatus = async (turnover: Turnover, status: Turnover['status']) => {
    if (status === 'assigned' && !turnover.vendor_id && !selected?.awarded_vendor_id) {
      setMessage('Select a cleaner from the Quotes tab before assigning this turnover.')
      return
    }
    if (status === 'completed' && (!turnover.final_photo_urls || turnover.final_photo_urls.length === 0)) {
      setMessage('Upload at least one completion photo before approving and completing the turnover.')
      return
    }

    const payload: Partial<Turnover> = { status }
    if (status === 'assigned' && !turnover.vendor_id && selected?.awarded_vendor_id) {
      payload.vendor_id = selected.awarded_vendor_id
      payload.source_quote_id = selected.awarded_quote_id
      if (awardedQuote) payload.agreed_price = Number(awardedQuote.total_price)
    }
    if (status === 'completed') payload.completed_at = new Date().toISOString()

    const { error } = await supabase.from('airbnb_turnovers').update(payload).eq('id', turnover.id)
    if (error) setMessage(error.message)
    else {
      setMessage(`Turnover marked ${status.replace(/_/g, ' ')}.`)
      await load()
    }
  }

  const uploadCompletionPhotos = async (turnover: Turnover, files: File[]) => {
    if (files.length === 0) return
    setSaving(true)
    setMessage(null)

    const uploaded: string[] = []
    for (const file of files) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `completion/${turnover.id}/${crypto.randomUUID()}-${safe}`
      const result = await supabase.storage.from('cleaning-turnover-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (result.error) {
        setMessage(`A completion photo failed to upload: ${result.error.message}`)
        continue
      }
      const { data } = supabase.storage.from('cleaning-turnover-photos').getPublicUrl(path)
      if (data.publicUrl) uploaded.push(data.publicUrl)
    }

    if (uploaded.length > 0) {
      const nextPhotos = [...(turnover.final_photo_urls || []), ...uploaded]
      const updated = await supabase
        .from('airbnb_turnovers')
        .update({ final_photo_urls: nextPhotos })
        .eq('id', turnover.id)

      if (updated.error) setMessage(updated.error.message)
      else {
        setMessage(`${uploaded.length} completion photo(s) added.`)
        await load()
      }
    }

    setSaving(false)
  }

  const selectedMessageTurnover = turnovers.find(t => t.id === messageForm.turnover_id) || selectedTurnovers[0] || null
  const selectedMessageVendor = selectedMessageTurnover?.vendor_id
    ? vendors.find(v => v.id === selectedMessageTurnover.vendor_id) || null
    : awardedVendor

  const logMessage = async () => {
    if (!selectedMessageTurnover || !messageForm.body.trim()) {
      setMessage('Select a turnover and enter a message.')
      return
    }

    const recipient = selectedMessageVendor?.email || selectedMessageVendor?.phone || null
    const insert = await supabase
      .from('airbnb_turnover_messages')
      .insert({
        turnover_id: selectedMessageTurnover.id,
        vendor_id: selectedMessageVendor?.id || null,
        direction: 'outbound',
        channel: messageForm.channel,
        recipient,
        body: messageForm.body.trim(),
        status: 'logged',
        sent_at: messageForm.channel === 'portal' ? new Date().toISOString() : null,
      })

    if (insert.error) {
      setMessage(insert.error.message)
      return
    }

    if (messageForm.channel === 'email' && selectedMessageVendor?.email) {
      const subject = encodeURIComponent(`Airbnb turnover - ${selected?.property_name || 'property'}`)
      const body = encodeURIComponent(messageForm.body.trim())
      window.location.href = `mailto:${selectedMessageVendor.email}?subject=${subject}&body=${body}`
    }

    if (messageForm.channel === 'sms' && selectedMessageVendor?.phone) {
      const body = encodeURIComponent(messageForm.body.trim())
      window.location.href = `sms:${selectedMessageVendor.phone}?body=${body}`
    }

    setMessageForm(form => ({ ...form, body: '' }))
    setMessage('Message logged. Email/SMS opens your device sender when selected.')
    await load()
  }

  const createPayment = async () => {
    const turnover = turnovers.find(t => t.id === paymentForm.turnover_id)
    if (!turnover || !paymentForm.amount) {
      setMessage('Select a turnover and enter the payment amount.')
      return
    }

    const insert = await supabase
      .from('airbnb_turnover_payments')
      .insert({
        turnover_id: turnover.id,
        vendor_id: turnover.vendor_id,
        amount: Number(paymentForm.amount),
        status: 'pending',
        method: paymentForm.method.trim() || null,
        due_at: paymentForm.due_at ? new Date(paymentForm.due_at).toISOString() : null,
        notes: paymentForm.notes.trim() || null,
      })

    if (insert.error) setMessage(insert.error.message)
    else {
      setMessage('Payment item created.')
      setPaymentForm({ turnover_id: '', amount: '', due_at: '', method: '', notes: '' })
      await load()
    }
  }

  const markPaymentPaid = async (payment: Payment) => {
    const { error } = await supabase
      .from('airbnb_turnover_payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)
    if (error) setMessage(error.message)
    else {
      setMessage('Payment marked paid.')
      await load()
    }
  }

  const nav: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'quotes', label: 'Quotes', count: selectedQuotes.length },
    { id: 'reservations', label: 'Reservations', count: selectedReservations.length },
    { id: 'turnovers', label: 'Turnovers', count: selectedTurnovers.length },
    { id: 'messages', label: 'Messages', count: selectedMessages.length },
    { id: 'payments', label: 'Payments', count: selectedPayments.length },
    { id: 'vendors', label: 'Vendors', count: vendors.length },
  ]

  const openTurnovers = selectedTurnovers.filter(t => !['completed', 'canceled'].includes(t.status)).length
  const pendingPayments = selectedPayments.filter(p => ['pending', 'approved', 'hold'].includes(p.status))
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-10">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-slate-500">PROPERTY OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl">Airbnb Turnover Operations Center</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            Collect cleaner quotes, select a vendor, track reservations, manage every turnover, log communications, and close payments.
          </p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold">
          <RefreshCw size={16}/> Refresh
        </button>
      </div>

      {message && <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Quotes received" value={String(selectedQuotes.length)} icon={<Sparkles size={18}/>}/>
        <Metric label="Open turnovers" value={String(openTurnovers)} icon={<Wrench size={18}/>}/>
        <Metric label="Selected cleaner" value={awardedVendor?.company_name || 'Not selected'} icon={<Users size={18}/>}/>
        <Metric label="Pending payments" value={`$${pendingAmount.toFixed(2)}`} icon={<Banknote size={18}/>}/>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <select className={input} value={selectedId || ''} onChange={e => setSelectedId(e.target.value || null)}>
          <option value="">Select property</option>
          {requests.map(request => <option key={request.id} value={request.id}>{request.property_name}</option>)}
        </select>
        {selected && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void copyLink(selected)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"><ClipboardCopy size={16}/> Copy quote link</button>
            <a href={publicUrl(selected)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><ExternalLink size={16}/> Public quote page</a>
            {selected.airbnb_url && <a href={selected.airbnb_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"><ExternalLink size={16}/> Airbnb</a>}
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === item.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {item.label}{typeof item.count === 'number' ? ` · ${item.count}` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={card}><div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><Loader2 size={18} className="animate-spin"/>Loading operations…</div></div>
      ) : tab === 'quotes' ? (
        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <section className={card}>
            <div className="mb-5 flex items-center gap-2"><Plus size={18}/><h2 className="text-lg font-black">New property quote request</h2></div>
            <div className="space-y-4">
              <div><label className={label}>Property name</label><input className={input} value={quoteForm.property_name} onChange={e => setQuoteForm(f => ({...f, property_name:e.target.value}))} placeholder="Dallas Airbnb"/></div>
              <div><label className={label}>Address</label><input className={input} value={quoteForm.property_address} onChange={e => setQuoteForm(f => ({...f, property_address:e.target.value}))}/></div>
              <div><label className={label}>Airbnb URL</label><input className={input} type="url" value={quoteForm.airbnb_url} onChange={e => setQuoteForm(f => ({...f, airbnb_url:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Bedrooms</label><input className={input} type="number" min="0" step="0.5" value={quoteForm.bedrooms} onChange={e => setQuoteForm(f => ({...f, bedrooms:e.target.value}))}/></div>
                <div><label className={label}>Bathrooms</label><input className={input} type="number" min="0" step="0.5" value={quoteForm.bathrooms} onChange={e => setQuoteForm(f => ({...f, bathrooms:e.target.value}))}/></div>
              </div>
              <div><label className={label}>Instructions</label><textarea className={input} rows={4} value={quoteForm.turnover_notes} onChange={e => setQuoteForm(f => ({...f, turnover_notes:e.target.value}))}/></div>
              <div>
                <label className={label}>Property photos</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-700">
                  <Camera size={18}/>{photos.length ? `${photos.length} selected` : 'Choose photos'}
                  <input className="hidden" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files || []))}/>
                </label>
              </div>
              <div className="rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
                Every submitted price must already include cleaning supplies, laundry, paper towels, and toilet paper.
              </div>
              <button disabled={saving} onClick={() => void createRequest()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                {saving ? <Loader2 size={17} className="animate-spin"/> : <Sparkles size={17}/>}Create quote request
              </button>
            </div>
          </section>

          <section className={card}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-wider text-slate-500">BID COMPARISON</p>
                <h2 className="text-xl font-black">{selected?.property_name || 'Select a property'}</h2>
                {awardedVendor && <p className="mt-1 text-sm font-bold text-emerald-700">Selected cleaner: {awardedVendor.company_name} · {awardedQuote ? `$${Number(awardedQuote.total_price).toFixed(2)}` : ''}</p>}
              </div>
              {selected?.status === 'awarded' && <button onClick={() => void reopenBidding()} className="rounded-xl border px-3 py-2 text-xs font-bold">Reopen bidding</button>}
            </div>

            {!selected ? <Empty text="Select a property."/> : selectedQuotes.length === 0 ? <Empty text="No quotes yet. Share the public quote link with cleaners."/> : (
              <div className="space-y-3">
                {selectedQuotes.map((quote, index) => {
                  const awarded = selected.awarded_quote_id === quote.id
                  return (
                    <div key={quote.id} className={`rounded-xl border p-4 ${awarded ? 'border-emerald-400 bg-emerald-50/50' : index === 0 ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">{quote.company_name}</p>
                            {awarded && <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black text-white">SELECTED</span>}
                            {!awarded && index === 0 && <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black">LOWEST</span>}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{quote.contact_name || 'No contact name'} · {quote.email || quote.phone || 'No contact'}</p>
                        </div>
                        <div className="md:text-right">
                          <p className="text-3xl font-black">${Number(quote.total_price).toFixed(2)}</p>
                          <p className="text-xs font-bold text-emerald-700">All required supplies included</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                        {quote.estimated_hours && <span>{quote.estimated_hours} hours</span>}
                        {quote.team_size && <span>{quote.team_size} cleaner{quote.team_size === 1 ? '' : 's'}</span>}
                        <span>{new Date(quote.submitted_at).toLocaleString()}</span>
                      </div>
                      {quote.availability_notes && <p className="mt-3 text-sm"><b>Availability:</b> {quote.availability_notes}</p>}
                      {quote.notes && <p className="mt-2 text-sm"><b>Notes:</b> {quote.notes}</p>}
                      {!awarded && <button disabled={saving} onClick={() => void awardQuote(quote)} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Select this cleaner</button>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      ) : tab === 'reservations' ? (
        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <section className={card}>
            <div className="mb-5 flex items-center gap-2"><CalendarDays size={18}/><h2 className="text-lg font-black">Add Airbnb reservation</h2></div>
            <p className="mb-4 text-sm text-slate-500">Each reservation automatically creates a turnover at checkout. If a cleaner is selected, the turnover is assigned automatically.</p>
            <div className="space-y-4">
              <div><label className={label}>Reservation code</label><input className={input} value={reservationForm.reservation_code} onChange={e => setReservationForm(f => ({...f, reservation_code:e.target.value}))}/></div>
              <div><label className={label}>Guest name</label><input className={input} value={reservationForm.guest_name} onChange={e => setReservationForm(f => ({...f, guest_name:e.target.value}))}/></div>
              <div><label className={label}>Guests</label><input className={input} type="number" min="1" value={reservationForm.guest_count} onChange={e => setReservationForm(f => ({...f, guest_count:e.target.value}))}/></div>
              <div><label className={label}>Check-in</label><input className={input} type="datetime-local" value={reservationForm.check_in_at} onChange={e => setReservationForm(f => ({...f, check_in_at:e.target.value}))}/></div>
              <div><label className={label}>Check-out</label><input className={input} type="datetime-local" value={reservationForm.check_out_at} onChange={e => setReservationForm(f => ({...f, check_out_at:e.target.value}))}/></div>
              <div><label className={label}>Notes</label><textarea className={input} rows={3} value={reservationForm.notes} onChange={e => setReservationForm(f => ({...f, notes:e.target.value}))}/></div>
              <button disabled={saving || !selected} onClick={() => void createReservation()} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-40">Create reservation + turnover</button>
            </div>
          </section>
          <section className={card}>
            <h2 className="mb-4 text-xl font-black">Reservations</h2>
            {selectedReservations.length === 0 ? <Empty text="No reservations yet."/> : (
              <div className="space-y-3">
                {selectedReservations.map(r => (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div><p className="font-black">{r.guest_name || 'Guest'}</p><p className="text-xs text-slate-500">{r.reservation_code || 'No reservation code'} · {r.guest_count || '—'} guest(s)</p></div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase">{r.status}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div><b>Check-in:</b> {new Date(r.check_in_at).toLocaleString()}</div>
                      <div><b>Check-out:</b> {new Date(r.check_out_at).toLocaleString()}</div>
                    </div>
                    {r.notes && <p className="mt-3 text-sm text-slate-600">{r.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : tab === 'turnovers' ? (
        <section className={card}>
          <div className="mb-5 flex items-center gap-2"><Wrench size={18}/><h2 className="text-xl font-black">Turnovers</h2></div>
          {selectedTurnovers.length === 0 ? <Empty text="No turnovers yet. Create an Airbnb reservation first."/> : (
            <div className="space-y-4">
              {selectedTurnovers.map(turnover => {
                const vendor = vendors.find(v => v.id === turnover.vendor_id)
                const payment = payments.find(p => p.turnover_id === turnover.id && !['void','refunded'].includes(p.status))
                return (
                  <div key={turnover.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{new Date(turnover.scheduled_for).toLocaleString()}</p>
                        <h3 className="mt-1 text-lg font-black">{vendor?.company_name || 'Cleaner not assigned'}</h3>
                        <p className="mt-1 text-sm text-slate-500">{turnover.agreed_price ? `Agreed price: $${Number(turnover.agreed_price).toFixed(2)}` : 'No agreed price yet'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase">{turnover.status.replace(/_/g, ' ')}</span>
                    </div>
                    {turnover.instructions && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{turnover.instructions}</p>}
                    {turnover.final_photo_urls?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Completion evidence</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                          {turnover.final_photo_urls.map((url, index) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={`Completion photo ${index + 1}`} className="aspect-square w-full rounded-xl object-cover"/>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {turnover.status === 'planned' && <StatusButton onClick={() => void updateTurnoverStatus(turnover, 'assigned')}>Assign selected cleaner</StatusButton>}
                      {turnover.status === 'assigned' && <StatusButton onClick={() => void updateTurnoverStatus(turnover, 'confirmed')}>Confirmed</StatusButton>}
                      {['assigned','confirmed'].includes(turnover.status) && <StatusButton onClick={() => void updateTurnoverStatus(turnover, 'in_progress')}>Start</StatusButton>}
                      {['in_progress','awaiting_review','completed'].includes(turnover.status) && (
                        <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">
                          {saving ? 'Uploading…' : 'Upload completion photos'}
                          <input className="hidden" type="file" accept="image/*" multiple disabled={saving} onChange={e => void uploadCompletionPhotos(turnover, Array.from(e.target.files || []))}/>
                        </label>
                      )}
                      {turnover.status === 'in_progress' && <StatusButton onClick={() => void updateTurnoverStatus(turnover, 'awaiting_review')}>Ready for review</StatusButton>}
                      {turnover.status === 'awaiting_review' && <StatusButton primary onClick={() => void updateTurnoverStatus(turnover, 'completed')}>Approve & complete</StatusButton>}
                      {!['completed','canceled'].includes(turnover.status) && <StatusButton onClick={() => void updateTurnoverStatus(turnover, 'canceled')}>Cancel</StatusButton>}
                      {!payment && turnover.agreed_price && <button onClick={() => { setPaymentForm({ turnover_id: turnover.id, amount: String(Number(turnover.agreed_price).toFixed(2)), due_at: '', method: '', notes: '' }); setTab('payments') }} className="rounded-xl border px-3 py-2 text-xs font-bold">Create payment</button>}
                      <button onClick={() => { setMessageForm(form => ({ ...form, turnover_id: turnover.id })); setTab('messages') }} className="rounded-xl border px-3 py-2 text-xs font-bold">Message cleaner</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ) : tab === 'messages' ? (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className={card}>
            <div className="mb-5 flex items-center gap-2"><MessageSquare size={18}/><h2 className="text-lg font-black">Message / follow-up</h2></div>
            <div className="space-y-4">
              <div>
                <label className={label}>Turnover</label>
                <select className={input} value={messageForm.turnover_id} onChange={e => setMessageForm(f => ({...f, turnover_id:e.target.value}))}>
                  <option value="">Select turnover</option>
                  {selectedTurnovers.map(t => <option key={t.id} value={t.id}>{new Date(t.scheduled_for).toLocaleString()} · {t.status}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Channel</label>
                <select className={input} value={messageForm.channel} onChange={e => setMessageForm(f => ({...f, channel:e.target.value as TurnoverMessage['channel']}))}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="phone">Phone</option>
                  <option value="portal">Portal log</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><label className={label}>Message</label><textarea className={input} rows={7} value={messageForm.body} onChange={e => setMessageForm(f => ({...f, body:e.target.value}))} placeholder="Confirm tomorrow's turnover, request completion photos, payment follow-up, etc."/></div>
              {selectedMessageVendor && <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Recipient: <b>{selectedMessageVendor.company_name}</b> · {selectedMessageVendor.email || selectedMessageVendor.phone || 'No contact method'}</div>}
              <button onClick={() => void logMessage()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Mail size={16}/>Log & open sender</button>
              <p className="text-xs leading-5 text-slate-400">Email and SMS use your device sender and are logged in XRankFlow. Direct server-side delivery is not enabled until an outbound email/SMS credential is configured.</p>
            </div>
          </section>
          <section className={card}>
            <h2 className="mb-4 text-xl font-black">Communication history</h2>
            {selectedMessages.length === 0 ? <Empty text="No communication logged yet."/> : (
              <div className="space-y-3">
                {selectedMessages.map(m => (
                  <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-wide">{m.channel} · {m.direction}</p>
                      <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{m.body}</p>
                    {m.recipient && <p className="mt-2 text-xs text-slate-400">Recipient: {m.recipient}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : tab === 'payments' ? (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className={card}>
            <div className="mb-5 flex items-center gap-2"><Banknote size={18}/><h2 className="text-lg font-black">Create payment item</h2></div>
            <div className="space-y-4">
              <div><label className={label}>Turnover</label><select className={input} value={paymentForm.turnover_id} onChange={e => {
                const turnover = selectedTurnovers.find(t => t.id === e.target.value)
                setPaymentForm(f => ({...f, turnover_id:e.target.value, amount: turnover?.agreed_price ? String(Number(turnover.agreed_price).toFixed(2)) : f.amount}))
              }}><option value="">Select turnover</option>{selectedTurnovers.map(t => <option key={t.id} value={t.id}>{new Date(t.scheduled_for).toLocaleString()} · {t.status}</option>)}</select></div>
              <div><label className={label}>Amount</label><input className={input} type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({...f, amount:e.target.value}))}/></div>
              <div><label className={label}>Due date</label><input className={input} type="datetime-local" value={paymentForm.due_at} onChange={e => setPaymentForm(f => ({...f, due_at:e.target.value}))}/></div>
              <div><label className={label}>Method</label><input className={input} value={paymentForm.method} onChange={e => setPaymentForm(f => ({...f, method:e.target.value}))} placeholder="Zelle, ACH, check, cash..."/></div>
              <div><label className={label}>Notes</label><textarea className={input} rows={3} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({...f, notes:e.target.value}))}/></div>
              <button onClick={() => void createPayment()} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Create pending payment</button>
            </div>
          </section>
          <section className={card}>
            <h2 className="mb-4 text-xl font-black">Payment tracking</h2>
            {selectedPayments.length === 0 ? <Empty text="No payments recorded yet."/> : (
              <div className="space-y-3">
                {selectedPayments.map(p => {
                  const turnover = turnovers.find(t => t.id === p.turnover_id)
                  const vendor = vendors.find(v => v.id === p.vendor_id)
                  return (
                    <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-black">${Number(p.amount).toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{vendor?.company_name || 'Vendor'} · {turnover ? new Date(turnover.scheduled_for).toLocaleDateString() : 'Turnover'}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</span>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        {p.due_at && <p><b>Due:</b> {new Date(p.due_at).toLocaleString()}</p>}
                        {p.method && <p><b>Method:</b> {p.method}</p>}
                        {p.notes && <p><b>Notes:</b> {p.notes}</p>}
                      </div>
                      {p.status !== 'paid' && <button onClick={() => void markPaymentPaid(p)} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Mark paid</button>}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className={card}>
          <div className="mb-5 flex items-center gap-2"><Users size={18}/><h2 className="text-xl font-black">Cleaning vendors</h2></div>
          {vendors.length === 0 ? <Empty text="No vendors yet. Select a cleaner from a submitted quote."/> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {vendors.map(v => (
                <div key={v.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black">{v.company_name}</p><p className="mt-1 text-xs text-slate-500">{v.contact_name || 'No contact name'}</p></div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase">{v.status}</span>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    {v.email && <p>{v.email}</p>}
                    {v.phone && <p>{v.phone}</p>}
                    {v.default_rate && <p><b>Default rate:</b> ${Number(v.default_rate).toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs font-black uppercase tracking-wide">{label}</span></div>
      <p className="mt-2 truncate text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{text}</div>
}

function StatusButton({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`rounded-xl px-3 py-2 text-xs font-bold ${primary ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white'}`}>{children}</button>
}
