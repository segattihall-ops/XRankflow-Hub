'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import type { BrandRecord } from '@/lib/supabase'

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('wh_brands')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setBrands(data || [])
      } catch (error) {
        console.error('Error fetching brands:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])

  const getColorForBrand = (index: number) => {
    const colors = ['#3b82f6', '#06b6d4', '#14b8a6', '#a855f7', '#ec4899', '#ea580c', '#0d9488']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando marcas...</p>
        </div>
      </div>
    )
  }

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

        {brands.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No brands yet
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Brands will appear here once they are created
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand, index) => {
              const brandColor = brand.color || getColorForBrand(index)
              const brandCode = brand.code || brand.slug.substring(0, 2).toUpperCase()
              return (
                <Link key={brand.id} href={`/brands/${brand.slug.toLowerCase()}`}>
                  <Card className="h-56 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                    <div
                      className="h-32 opacity-20 mb-4 -mx-6 -mt-6"
                      style={{ backgroundColor: brandColor }}
                    />
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: brandColor }}
                        >
                          {brandCode}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {brand.name}
                          </h3>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {brand.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                      OPEN WORKSPACE <ArrowRight size={16} className="ml-2" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
