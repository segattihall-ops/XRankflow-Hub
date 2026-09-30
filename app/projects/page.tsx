'use client'

import { useEffect, useState } from 'react'
import { FolderKanban } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { supabase, type ProjectRecord } from '@/lib/supabase'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('wh_projects').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProjects((data || []) as ProjectRecord[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
      <p className="text-xs font-bold tracking-widest text-slate-500">EXECUÇÃO</p>
      <h1 className="text-3xl font-bold text-slate-950 mt-1">Projetos</h1>
      <p className="text-slate-500 mt-2 mb-8">Projetos operacionais registrados no XRANKFLOW OS.</p>

      {loading && <Card className="p-8 text-center text-slate-500">Carregando projetos…</Card>}
      {error && <Card className="p-8 border-red-200"><p className="font-semibold text-red-700">Não foi possível carregar os projetos.</p><p className="text-sm text-slate-500 mt-1">{error}</p></Card>}
      {!loading && !error && projects.length === 0 && (
        <Card className="p-12 text-center"><FolderKanban className="mx-auto text-slate-300" size={44}/><p className="font-semibold mt-3">Nenhum projeto registrado</p></Card>
      )}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id} className="p-5">
            <div className="flex justify-between gap-3">
              <h2 className="font-bold text-lg">{project.name}</h2>
              <span className="text-xs px-2 py-1 rounded bg-slate-100 h-fit">{project.status || 'Sem status'}</span>
            </div>
            {project.description && <p className="text-sm text-slate-600 mt-3">{project.description}</p>}
            <div className="mt-5 text-sm space-y-2">
              <p><span className="text-slate-500">Responsável:</span> {project.owner || 'Não definido'}</p>
              <p><span className="text-slate-500">Próximo passo:</span> {project.next_step || 'Não definido'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
