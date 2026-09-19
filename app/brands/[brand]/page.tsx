'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { mockBrands } from '@/data/mockData'

interface BrandPageProps {
  params: { brand: string }
}

export default function BrandPage({ params }: BrandPageProps) {
  const brand = mockBrands.find(b => b.code.toLowerCase() === params.brand)

  if (!brand) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <Card className="text-center p-12">
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Brand not found
          </p>
          <Link href="/brands" className="text-blue-600 hover:text-blue-700">
            ← Back to Brands
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 400%22%3E%3Crect fill=%23${brand.color.slice(1)}%22 width=%221200%22 height=%22400%22/%3E%3C/svg%3E")`,
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/brands" className="text-blue-400 hover:text-blue-300 text-sm font-medium w-fit">
            ← All Brands
          </Link>
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-12 h-12 rounded flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: brand.color }}
              >
                {brand.code}
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">{brand.name}</h1>
              </div>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl">{brand.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-10 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard
            label="Open Tasks"
            value={brand.stats.tasks}
            color="blue"
          />
          <KPICard
            label="Revenue"
            value={`$${(brand.stats.revenue / 1000).toFixed(0)}k`}
            color="green"
          />
          <KPICard
            label="Net Profit"
            value={`$${(brand.stats.profit / 1000).toFixed(0)}k`}
            color="green"
          />
          <KPICard
            label="CRM Contacts"
            value={brand.stats.contacts}
            color="purple"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tasks */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="section-label">EXECUTION</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h3>
              </div>
              <Link href="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                All tasks →
              </Link>
            </div>
            <Card className="flex items-center justify-center min-h-[200px]">
              <div className="text-center text-gray-600 dark:text-gray-400">
                No tasks yet
              </div>
            </Card>
          </div>

          {/* Pipeline */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="section-label">SALES</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline</h3>
              </div>
              <Link href="/crm" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Full CRM →
              </Link>
            </div>
            <Card className="flex items-center justify-center min-h-[200px]">
              <div className="text-center text-gray-600 dark:text-gray-400">
                No pipeline data
              </div>
            </Card>
          </div>
        </div>

        {/* Finance Overview */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="section-label">ECONOMICS</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Finance Overview
              </h3>
            </div>
            <Link href="/finance" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Full Finance →
            </Link>
          </div>
          <Card className="flex items-center justify-center min-h-[200px]">
            <div className="text-center text-gray-600 dark:text-gray-400">
              No financial data
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
