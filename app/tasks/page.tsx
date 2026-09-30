'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase, type TaskRecord } from '@/lib/supabase'

export default function TasksPage() {
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [showForm,setShowForm]=useState(false)
  const [saving,setSaving]=useState(false)
  const [title,setTitle]=useState('')
  const [priority,setPriority]=useState('Medium')
  const [status,setStatus]=useState('Next')
  const [dueDate,setDueDate]=useState('')
  const [filter,setFilter]=useState('All')

  async function load(){
    setLoading(true); setError(null)
    const {data,error}=await supabase.from('wh_tasks').select('*').order('created_at',{ascending:false})
    if(error)setError(error.message); else setTasks((data||[]) as TaskRecord[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function createTask(e:FormEvent){
    e.preventDefault()
    if(!title.trim()) return
    setSaving(true)
    const org=await supabase.from('wh_organizations').select('id').eq('slug','xrmg').single()
    if(org.error||!org.data){setError(org.error?.message||'Organização XRMG não encontrada');setSaving(false);return}
    const {error}=await supabase.from('wh_tasks').insert({
      org_id:org.data.id,title:title.trim(),priority,status,due_date:dueDate||null,area:'Operations',owner_role:'CEO'
    })
    if(error){setError(error.message)} else {
      setTitle('');setDueDate('');setPriority('Medium');setStatus('Next');setShowForm(false);await load()
    }
    setSaving(false)
  }

  const filtered=useMemo(()=>filter==='All'?tasks:tasks.filter(t=>t.status===filter),[tasks,filter])
  const overdue=tasks.filter(t=>t.due_date&&t.due_date<new Date().toISOString().slice(0,10)&&t.status!=='Done').length

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div><p className="text-xs font-bold tracking-[0.18em] text-slate-500">EXECUÇÃO</p><h1 className="text-3xl font-black mt-1">Tarefas</h1><p className="text-slate-500 mt-2">{tasks.length} registradas · {overdue} vencidas</p></div>
      <Button onClick={()=>setShowForm(v=>!v)}><Plus size={18}/>Nova tarefa</Button>
    </div>

    {showForm&&<Card className="p-5 mb-6">
      <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Criar tarefa</h2><button onClick={()=>setShowForm(false)}><X size={18}/></button></div>
      <form onSubmit={createTask} className="grid md:grid-cols-4 gap-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="O que precisa ser feito?" className="md:col-span-4 px-3 py-2.5 rounded-lg border border-slate-300" required/>
        <select value={priority} onChange={e=>setPriority(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300"><option>High</option><option>Medium</option><option>Low</option></select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300"><option>Inbox</option><option>Next</option><option>In Progress</option><option>Waiting</option><option>Done</option><option>Parked</option></select>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300"/>
        <Button type="submit" disabled={saving}>{saving?'Salvando…':'Criar tarefa'}</Button>
      </form>
    </Card>}

    {error&&<Card className="p-5 border-red-200 mb-6"><p className="font-semibold text-red-700">Não foi possível concluir a operação.</p><p className="text-sm text-slate-500 mt-1">{error}</p></Card>}

    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {['All','Inbox','Next','In Progress','Waiting','Done','Parked'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter===s?'bg-slate-950 text-white':'bg-white border border-slate-200'}`}>{s==='All'?'Todas':s}</button>)}
    </div>

    {loading?<Card className="p-8 text-center text-slate-500">Carregando tarefas…</Card>:filtered.length===0?<Card className="p-8 text-center text-slate-500">Nenhuma tarefa nesta visão.</Card>:
      <div className="space-y-3">{filtered.map(task=><Card key={task.id} className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><p className="font-bold">{task.title}</p><p className="text-sm text-slate-500 mt-1">{task.area||'Sem área'} · {task.owner_role||'Sem responsável'}{task.due_date?` · prazo ${task.due_date}`:''}</p></div><div className="flex gap-2"><span className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{task.status}</span>{task.priority&&<span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">{task.priority}</span>}</div></div>
      </Card>)}</div>}
  </div>
}
