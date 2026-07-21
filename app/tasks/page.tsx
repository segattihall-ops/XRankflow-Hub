'use client'

import { useEffect, useState } from 'react'
import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import type { TaskRecord } from '@/lib/supabase'

export default function TasksPage() {
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

  const statusCounts = {
    total: tasks.length,
    open: tasks.filter(t => ['Inbox', 'Next', 'In Progress', 'Waiting'].includes(t.status)).length,
    done: tasks.filter(t => t.status === 'Done').length,
    blocked: tasks.filter(t => t.status === 'Parked').length,
  }

  const statusCards = [
    { label: 'Total', value: statusCounts.total, icon: '📋' },
    { label: 'Open', value: statusCounts.open, icon: '⏱️' },
    { label: 'Done', value: statusCounts.done, icon: '✅' },
    { label: 'Blocked', value: statusCounts.blocked, icon: '⚠️' },
  ]

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
            <p className="section-label">EXECUTION</p>
            <h1 className="section-title mb-2">Tasks & Sprints</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Execution inbox — all tasks across brands and projects
            </p>
          </div>
          <Button>
            <Plus size={20} />
            New Task
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statusCards.map((card) => (
            <Card key={card.label}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <span className="text-3xl">{card.icon}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option>All Statuses</option>
          </select>
          <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option>All Brands</option>
          </select>
        </div>

        {/* Empty State */}
        {tasks.length === 0 ? (
          <Card className="text-center py-16">
            <Zap size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Click "New Task" to create your first task
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{task.area}</p>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    {task.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
