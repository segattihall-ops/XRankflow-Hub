'use client'

import Link from 'next/link'
import { FileText, FolderKanban, CheckCircle2, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Badge } from '@/components/ui/Badge'
import { mockUsers, mockBrands, mockActivityLog } from '@/data/mockData'

const quickAccessItems = [
  {
    title: 'Hub Navigator',
    description: 'Browse modules, documents and policies',
    href: '/hub-navigator',
    color: 'bg-blue-600',
  },
  {
    title: 'Projects',
    description: 'Cross-brand operational initiatives',
    href: '/projects',
    color: 'bg-purple-600',
  },
  {
    title: 'Finance & KPIs',
    description: 'Revenue, costs, and unit economics',
    href: '/finance',
    color: 'bg-green-600',
  },
  {
    title: 'Tasks & Sprints',
    description: 'Execution inbox across all brands',
    href: '/tasks',
    color: 'bg-orange-600',
  },
  {
    title: 'CRM & Pipeline',
    description: 'Leads, clients, and partner pipeline',
    href: '/crm',
    color: 'bg-indigo-600',
  },
  {
    title: 'Team & People',
    description: 'Cross-brand organization directory',
    href: '/team',
    color: 'bg-cyan-600',
  },
]

export default function Home() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero Section */}
      <div
        className="relative h-[500px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 600%22%3E%3Crect fill=%22%23111827%22 width=%221200%22 height=%22600%22/%3E%3C/svg%3E")',
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div>
            <p className="text-sm uppercase tracking-widest text-teal-400 font-semibold mb-4">
              XRANKFLOW MEDIA GROUP LLC
            </p>
            <h1 className="text-5xl font-bold text-white mb-6">XRMG Command Center</h1>
            <p className="text-lg text-gray-300 max-w-2xl mb-8">
              Welcome back, Segatti. Access brand workspaces, projects, finance and more — all
              in one place.
            </p>

            {/* Navigation Buttons */}
            <div className="flex gap-4 flex-wrap">
              <Button
                variant="ghost"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                Company Profile
              </Button>
              <Button
                variant="ghost"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                Projects
              </Button>
              <Button
                variant="ghost"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                SOPs
              </Button>
              <Button
                variant="ghost"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                Team
              </Button>
              <Button
                variant="ghost"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                Activity
              </Button>
            </div>
          </div>

          {/* Date/Time */}
          <div className="text-gray-300 text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard
            label="Documents"
            value="16"
            icon={<FileText size={32} />}
            color="purple"
          />
          <KPICard
            label="Total Projects"
            value="6"
            icon={<FolderKanban size={32} />}
            color="blue"
          />
          <KPICard
            label="Active Projects"
            value="5"
            icon={<CheckCircle2 size={32} />}
            color="green"
          />
          <KPICard
            label="Team Members"
            value="8"
            icon={<Users size={32} />}
            color="orange"
          />
        </div>

        {/* Quick Access */}
        <div className="mb-16">
          <p className="section-label">QUICK ACCESS</p>
          <h2 className="section-title mb-6">Operations Hub</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-48 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                  <div
                    className={`h-24 ${item.color} opacity-10 mb-4 -mx-6 -mt-6`}
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    OPEN <ArrowRight size={16} className="ml-2" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Brand Workspaces */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="section-label">PORTFOLIO</p>
              <h2 className="section-title">Brand Workspaces</h2>
            </div>
            <Link href="/brands" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all →
            </Link>
          </div>

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

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"></div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <p className="section-label">LIVE FEED</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Company Updates
            </h3>

            <div className="space-y-4">
              {mockActivityLog.map((entry) => (
                <div key={entry.id} className="flex gap-3 pb-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    {entry.user.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {entry.user.name}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400"> {entry.action} </span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {entry.resourceType}: {entry.resource}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {entry.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              <span className="font-semibold">One Team. Seven Brands.</span>
              <br />
              <span className="text-xs uppercase tracking-wider">Infinite Impact.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
