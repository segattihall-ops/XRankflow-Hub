'use client'

import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const modules = [
  { name: 'Admin HQ', count: 3, icon: '🏢' },
  { name: 'Legal & Compliance', count: 3, icon: '⚖️' },
  { name: 'Finance', count: 3, icon: '💰' },
  { name: 'Operations', count: 1, icon: '⚙️' },
  { name: 'Marketing & Sales', count: 2, icon: '📊' },
  { name: 'Tech & Product', count: 2, icon: '💻' },
  { name: 'MasseurMatch', count: 8, icon: '❤️' },
  { name: 'Voxmation', count: 1, icon: '📡' },
  { name: 'RankFlow', count: 1, icon: '📈' },
  { name: 'Despachante USA', count: 0, icon: '📁' },
  { name: 'BayTide', count: 0, icon: '⚓' },
  { name: 'TPS Travel', count: 0, icon: '✈️' },
  { name: 'Bloom Cleaning', count: 0, icon: '🧹' },
  { name: 'Archive', count: 0, icon: '📦' },
]

export default function HubNavigatorPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div>
          <p className="section-label">NAVIGATION</p>
          <h1 className="section-title mb-2">Hub Navigator</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Browse modules, operations, and policy documents.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Modules */}
          <div className="lg:col-span-1">
            <p className="section-label mb-4">MODULES</p>
            <div className="space-y-1">
              {modules.map((module) => (
                <div
                  key={module.name}
                  className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{module.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.name}
                      </p>
                      <p className="text-xs text-gray-500">({module.count})</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-5xl mb-4">📂</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  SELECT A MODULE TO VIEW DOCUMENTS
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a module from the left to browse its documents
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
