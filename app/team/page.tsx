'use client'

import { Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockUsers } from '@/data/mockData'

export default function TeamPage() {
  const getAccessColor = (access: string) => {
    if (access === 'Full Access') return 'success'
    if (access === 'Edit Access') return 'info'
    if (access === 'Read Only') return 'onhold'
    return 'warning'
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="section-label">ORGANIZATION</p>
            <h1 className="section-title mb-2">Team Directory</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cross-brand organization and access rights.
            </p>
          </div>
          <div className="relative w-64">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search directory..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockUsers.map((user) => (
            <Card key={user.id} className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                style={{ backgroundColor: '#3b82f6' }}
              >
                {user.avatar}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                {user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{user.department}</p>
              <a
                href={`mailto:${user.email}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline block mb-4"
              >
                {user.email}
              </a>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
                Access
              </p>
              <Badge variant={getAccessColor(user.access) as any}>
                {user.access}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
