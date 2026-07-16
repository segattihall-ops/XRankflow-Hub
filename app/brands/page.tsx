'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { mockBrands } from '@/data/mockData'

export default function BrandsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <div
        className="relative h-80 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 400%22%3E%3Crect fill=%22%23374151%22 width=%221200%22 height=%22400%22/%3E%3C/svg%3E")',
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-center p-12">
          <p className="text-sm uppercase tracking-widest text-teal-400 font-semibold mb-4">
            XRANKFLOW PORTFOLIO
          </p>
          <h1 className="text-5xl font-bold text-white mb-4">Brand Workspaces</h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Access individual brand operations, metrics, and management dashboards.
          </p>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="px-10 py-12">
        <p className="section-label mb-4">ACTIVE</p>
        <h2 className="section-title mb-8">Operating Brands</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockBrands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.code.toLowerCase()}`}>
              <Card className="h-56 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                <div
                  className="h-32 opacity-20 mb-4 -mx-6 -mt-6"
                  style={{ backgroundColor: brand.color }}
                />
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: brand.color }}
                    >
                      {brand.code}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {brand.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {brand.description}
                  </p>
                </div>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  OPEN WORKSPACE <ArrowRight size={16} className="ml-2" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
