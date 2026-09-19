'use client'

import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function CRMPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="section-label">SALES</p>
            <h1 className="section-title mb-2">CRM & Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Leads, clients, and partner pipeline across all brands
            </p>
          </div>
          <Button>
            <Plus size={20} />
            Add Contact
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Contacts', value: 0 },
            { label: 'Leads', value: 0, color: 'orange' },
            { label: 'Clients', value: 0, color: 'green' },
            { label: 'Pipeline Value', value: '$0', color: 'blue' },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
              <p className="text-5xl font-bold mt-2">{item.value}</p>
            </Card>
          ))}
        </div>

        {/* Pipeline Stages */}
        <div className="mb-8">
          <p className="section-label mb-4">PIPELINE STAGES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CLOSED WON', 'CLOSED LOST'].map(
              (stage) => (
                <Card key={stage} className="text-center">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">0</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {stage}
                  </p>
                  <p className="text-gray-400">—</p>
                </Card>
              )
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          {['All Brands', 'All Types', 'All Stages'].map((label) => (
            <select key={label} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
              <option>{label}</option>
            </select>
          ))}
        </div>

        {/* Empty State */}
        <Card className="text-center py-16">
          <Users size={64} className="mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No contacts yet
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Click "Add Contact" to start building your pipeline
          </p>
        </Card>
      </div>
    </div>
  )
}
