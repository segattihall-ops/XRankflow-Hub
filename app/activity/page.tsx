'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ActivityLogEntry {
  id: string
  user_name: string
  user_avatar: string
  action: string
  resource: string
  resource_type: string
  created_at: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Try to fetch from activity log table if it exists
        const { data, error } = await supabase
          .from('wh_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (!error && data) {
          setActivities(data as ActivityLogEntry[])
        } else {
          // Fallback: show recent tasks and finance records
          const [tasks, finance] = await Promise.all([
            supabase.from('wh_tasks').select('id, title, created_at, owner_role').order('created_at', { ascending: false }).limit(5),
            supabase.from('wh_finance').select('id, item, created_at').order('created_at', { ascending: false }).limit(5),
          ])

          const combined = [
            ...(tasks.data?.map((t: any) => ({
              id: t.id,
              user_name: t.owner_role,
              user_avatar: t.owner_role.substring(0, 1),
              action: 'criou',
              resource: t.title,
              resource_type: 'Task',
              created_at: t.created_at,
            })) || []),
            ...(finance.data?.map((f: any) => ({
              id: f.id,
              user_name: 'Finance',
              user_avatar: 'F',
              action: 'registrou',
              resource: f.item,
              resource_type: 'Finance',
              created_at: f.created_at,
            })) || []),
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          setActivities(combined)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando atividades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div>
          <p className="section-label">LOGS</p>
          <h1 className="section-title mb-2">System Activity Log</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Registro imutável de todas as ações do hub · {activities.length} atividades
          </p>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-0">
          {activities.length > 0 ? (
            activities.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-4 p-5 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  {entry.user_avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {entry.user_name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400"> {entry.action} </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {entry.resource_type}:
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {' '}
                      {entry.resource}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(entry.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Activity size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma atividade ainda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
