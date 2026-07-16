'use client'

import { useEffect, useState } from 'react'
import { Plus, BarChart3, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import type { TaskRecord } from '@/lib/supabase'

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('wh_tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getRiskColor = (priority: string): 'high' | 'medium' | 'low' => {
    if (priority === 'High') return 'high'
    if (priority === 'Medium') return 'medium'
    return 'low'
  }

  const getStatusColor = (status: string): 'active' | 'onhold' => {
    return status === 'In Progress' || status === 'Next' ? 'active' : 'onhold'
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="section-label">PROJECTS & TASKS</p>
            <h1 className="section-title mb-2">Tarefas em Execução</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no sistema
            </p>
          </div>
          <Button>
            <Plus size={20} />
            Nova Tarefa
          </Button>
        </div>

        {/* Table */}
        {tasks.length === 0 ? (
          <Card className="text-center py-16">
            <BarChart3 size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma tarefa ainda
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Clique em "Nova Tarefa" para começar
            </p>
          </Card>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Título
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Área
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Prioridade
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Notas
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {task.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {task.area}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {task.owner_role}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRiskColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {task.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                          <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors">
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
