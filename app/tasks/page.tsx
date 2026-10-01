'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase, type ProjectRecord, type TaskRecord } from '@/lib/supabase'

type AuditRow = {
  id: string
  action: string
  task_id: string
  occurred_at: string
}

const statuses = ['Inbox', 'Next', 'In Progress', 'Waiting', 'Done', 'Parked']

export default function TasksPage() {
  const [tasks,setTasks]=useState<TaskRecord[]>([])
  const [projects,setProjects]=useState<ProjectRecord[]>([])
  const [audit,setAudit]=useState<AuditRow[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [notice,setNotice]=useState<string|null>(null)
  const [showForm,setShowForm]=useState(false)
  const [saving,setSaving]=useState(false)
  const [updatingId,setUpdatingId]=useState<string|null>(null)
  const [title,setTitle]=useState('')
  const [priority,setPriority]=useState('Medium')
  const [status,setStatus]=useState('Next')
  const [dueDate,setDueDate]=useState('')
  const [projectId,setProjectId]=useState('')
  const [filter,setFilter]=useState('All')
  const [projectFilter,setProjectFilter]=useState('All')
  const createKey=useRef('')

  async function load(){
    setLoading(true)
    setError(null)
    const [tasksRes,projectsRes,auditRes]=await Promise.all([
      supabase.from('wh_tasks').select('*').order('created_at',{ascending:false}),
      supabase.from('wh_projects').select('*').order('name',{ascending:true}),
      supabase.from('xrmg_task_audit_log').select('id,action,task_id,occurred_at').order('occurred_at',{ascending:false}).limit(12),
    ])
    const first=tasksRes.error||projectsRes.error
    if(first){
      setError(first.message)
    } else {
      setTasks((tasksRes.data||[]) as TaskRecord[])
      setProjects((projectsRes.data||[]) as ProjectRecord[])
      if(!auditRes.error) setAudit((auditRes.data||[]) as AuditRow[])
    }
    setLoading(false)
  }

  useEffect(()=>{void load()},[])

  function openForm(){
    createKey.current=crypto.randomUUID()
    setShowForm(true)
  }

  async function createTask(e:FormEvent){
    e.preventDefault()
    if(!title.trim()) return
    setSaving(true)
    setError(null)
    setNotice(null)

    const response=await fetch('/api/tasks',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        title:title.trim(),
        priority,
        status,
        due_date:dueDate||null,
        project_id:projectId||null,
        idempotency_key:createKey.current||crypto.randomUUID(),
      }),
    })
    const result=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}))

    if(!response.ok){
      setError(result.error||'Não foi possível criar a tarefa.')
    } else {
      setTitle('')
      setDueDate('')
      setProjectId('')
      setPriority('Medium')
      setStatus('Next')
      setShowForm(false)
      createKey.current=''
      setNotice('Tarefa criada e auditada com sucesso.')
      await load()
    }
    setSaving(false)
  }

  async function updateStatus(task:TaskRecord,nextStatus:string){
    if(nextStatus===task.status) return
    setUpdatingId(task.id)
    setError(null)
    setNotice(null)

    const response=await fetch('/api/tasks',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        task_id:task.id,
        status:nextStatus,
        idempotency_key:crypto.randomUUID(),
      }),
    })
    const result=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}))

    if(!response.ok){
      setError(result.error||'Não foi possível atualizar a tarefa.')
    } else {
      setNotice('Status atualizado e registrado no audit log.')
      await load()
    }
    setUpdatingId(null)
  }

  const filtered=useMemo(()=>tasks.filter(t=>{
    const statusOk=filter==='All'||t.status===filter
    const projectOk=projectFilter==='All'||(projectFilter==='None'?!t.project_id:t.project_id===projectFilter)
    return statusOk&&projectOk
  }),[tasks,filter,projectFilter])

  const projectById=useMemo(()=>new Map(projects.map(p=>[p.id,p])),[projects])
  const overdue=tasks.filter(t=>t.due_date&&t.due_date<new Date().toISOString().slice(0,10)&&t.status!=='Done').length

  return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <p className="text-xs font-bold tracking-[0.18em] text-slate-500">EXECUÇÃO</p>
        <h1 className="text-3xl font-black mt-1">Tarefas</h1>
        <p className="text-slate-500 mt-2">{tasks.length} registradas · {overdue} vencidas · writes validados no servidor</p>
      </div>
      <Button onClick={()=>showForm?setShowForm(false):openForm()}><Plus size={18}/>Nova tarefa</Button>
    </div>

    {showForm&&<Card className="p-5 mb-6">
      <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Criar tarefa</h2><button onClick={()=>setShowForm(false)}><X size={18}/></button></div>
      <form onSubmit={createTask} className="grid md:grid-cols-4 gap-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="O que precisa ser feito?" className="md:col-span-4 px-3 py-2.5 rounded-lg border border-slate-300" maxLength={240} required/>
        <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="md:col-span-2 px-3 py-2.5 rounded-lg border border-slate-300">
          <option value="">Sem projeto</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={priority} onChange={e=>setPriority(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300"><option>High</option><option>Medium</option><option>Low</option></select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300">{statuses.map(s=><option key={s}>{s}</option>)}</select>
        <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="md:col-span-2 px-3 py-2.5 rounded-lg border border-slate-300"/>
        <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving?'Salvando…':'Criar tarefa'}</Button></div>
      </form>
      <p className="text-xs text-slate-400 mt-4">O servidor valida status, prioridade, projeto, autenticação e membership antes de escrever.</p>
    </Card>}

    {error&&<Card className="p-5 border-red-200 mb-6"><p className="font-semibold text-red-700">Não foi possível concluir a operação.</p><p className="text-sm text-slate-500 mt-1">{error}</p></Card>}
    {notice&&<Card className="p-4 border-emerald-200 bg-emerald-50 mb-6"><p className="text-sm font-semibold text-emerald-700">{notice}</p></Card>}

    <div className="grid lg:grid-cols-[1fr_auto] gap-3 mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All',...statuses].map(s=><button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter===s?'bg-slate-950 text-white':'bg-white border border-slate-200'}`}>{s==='All'?'Todas':s}</button>)}
      </div>
      <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm">
        <option value="All">Todos os projetos</option>
        <option value="None">Sem projeto</option>
        {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>

    <div className="grid xl:grid-cols-[2fr_1fr] gap-6">
      <div>
        {loading?<Card className="p-8 text-center text-slate-500">Carregando tarefas…</Card>:filtered.length===0?<Card className="p-8 text-center text-slate-500">Nenhuma tarefa nesta visão.</Card>:
          <div className="space-y-3">{filtered.map(task=><Card key={task.id} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div>
                <p className="font-bold">{task.title}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {task.area||'Sem área'} · {task.owner_role||'Sem responsável'}
                  {task.project_id?` · ${projectById.get(task.project_id)?.name||'Projeto vinculado'}`:''}
                  {task.due_date?` · prazo ${task.due_date}`:''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {task.priority&&<span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">{task.priority}</span>}
                <select
                  value={task.status}
                  onChange={e=>void updateStatus(task,e.target.value)}
                  disabled={updatingId===task.id}
                  className="text-xs bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200"
                >
                  {statuses.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </Card>)}</div>}
      </div>

      <Card className="p-5 h-fit">
        <h2 className="font-bold">Auditoria recente</h2>
        <p className="text-xs text-slate-500 mt-1">Fonte: xrmg_task_audit_log</p>
        <div className="mt-4 space-y-3">
          {audit.length===0?<p className="text-sm text-slate-500">Nenhum evento auditado visível.</p>:audit.map(row=><div key={row.id} className="border-b border-slate-100 pb-3">
            <p className="text-sm font-semibold">{row.action==='task.created'?'Tarefa criada':'Status alterado'}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(row.occurred_at).toLocaleString('pt-BR')}</p>
          </div>)}
        </div>
      </Card>
    </div>
  </div>
}
