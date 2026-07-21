'use client'

import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { supabase } from '@/lib/supabase'
import type { FinanceRecord, KPIRecord } from '@/lib/supabase'

export default function FinancePage() {
  const [finance, setFinance] = useState<FinanceRecord[]>([])
  const [kpis, setKpis] = useState<KPIRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [finRes, kpiRes] = await Promise.all([
          supabase.from('wh_finance').select('*').order('created_at', { ascending: false }),
          supabase.from('wh_kpis').select('*').order('created_at', { ascending: false }),
        ])

        if (finRes.data) setFinance(finRes.data)
        if (kpiRes.data) setKpis(kpiRes.data)
      } catch (error) {
        console.error('Error fetching finance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalRevenue = finance
    .filter(f => f.type === 'Revenue' && f.amount)
    .reduce((sum, f) => sum + (f.amount || 0), 0)

  const totalCosts = finance
    .filter(f => (f.type === 'Expense' || f.type === 'Subscription') && f.amount)
    .reduce((sum, f) => sum + (f.amount || 0), 0)

  const netProfit = totalRevenue - totalCosts

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados financeiros...</p>
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
            <p className="section-label">FINANCE</p>
            <h1 className="section-title mb-2">Finance & KPIs</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Custos, assinaturas e receitas · {finance.length} registros
            </p>
          </div>
          <Button>
            <Plus size={20} />
            Novo Registro
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <KPICard
            label="Total Revenue"
            value={`$${(totalRevenue / 1000).toFixed(1)}k`}
            icon={<TrendingUp size={32} />}
            color="green"
          />
          <KPICard
            label="Total Costs"
            value={`$${(totalCosts / 1000).toFixed(1)}k`}
            icon={<TrendingDown size={32} />}
            color="orange"
          />
          <KPICard
            label="Net Profit"
            value={`$${(netProfit / 1000).toFixed(1)}k`}
            icon={<DollarSign size={32} />}
            color={netProfit >= 0 ? 'green' : 'orange'}
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

        {/* Finance Records Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            {finance.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-5xl mb-3">📊</p>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Sem registros financeiros
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Clique "Novo Registro" para começar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2 text-left font-semibold">Item</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Amount</th>
                      <th className="px-4 py-2 text-left font-semibold">Frequency</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.map(rec => (
                      <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-3">{rec.item}</td>
                        <td className="px-4 py-3 text-xs">{rec.type}</td>
                        <td className="px-4 py-3 font-semibold">${rec.amount?.toLocaleString() || '—'}</td>
                        <td className="px-4 py-3 text-xs">{rec.frequency}</td>
                        <td className="px-4 py-3 text-xs"><span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{rec.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* KPIs By Brand */}
          <Card>
            <h3 className="font-semibold mb-4">KPI Scorecard</h3>
            {kpis.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Sem KPIs registrados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {kpis.slice(0, 5).map(kpi => (
                  <div key={kpi.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{kpi.metric}</p>
                    <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span>Target: {kpi.target}</span>
                      <span>Actual: {kpi.actual}</span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        kpi.health === 'On Track' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        kpi.health === 'At Risk' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {kpi.health}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
