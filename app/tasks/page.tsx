'use client'

import { Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const statusCards = [
  { label: 'Total', value: 0, icon: '📋' },
  { label: 'Open', value: 0, icon: '⏱️' },
  { label: 'Done', value: 0, icon: '✅' },
  { label: 'Blocked', value: 0, icon: '⚠️' },
]

export default function TasksPage() {
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
        <Card className="text-center py-16">
          <Zap size={64} className="mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tasks yet
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Click "New Task" to create your first task
          </p>
        </Card>
      </div>
    </div>
  )
}
