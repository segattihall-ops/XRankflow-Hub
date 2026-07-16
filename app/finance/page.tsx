'use client'

import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'

export default function FinancePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="section-label">FINANCIAL</p>
            <h1 className="section-title mb-2">Finance & KPIs</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Revenue, costs, and unit economics across all brands
            </p>
          </div>
          <Button>
            <Plus size={20} />
            Add Record
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <KPICard
            label="Total Revenue"
            value="$0"
            icon={<TrendingUp size={32} />}
            color="green"
          />
          <KPICard
            label="Total Costs"
            value="$0"
            icon={<TrendingDown size={32} />}
            color="orange"
          />
          <KPICard
            label="Net Profit"
            value="$0"
            icon={<DollarSign size={32} />}
            color="green"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option>All Brands</option>
          </select>
          <input
            type="text"
            placeholder="Date range"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            📅
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-5xl mb-3">📊</p>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                No financial records yet
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Click "Add Record" to start tracking
              </p>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-4">By Brand</p>
              <p className="text-gray-600 dark:text-gray-400">No brand data</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
