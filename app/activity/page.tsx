'use client'

import { Activity } from 'lucide-react'
import { mockActivityLog } from '@/data/mockData'

export default function ActivityPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div>
          <p className="section-label">LOGS</p>
          <h1 className="section-title mb-2">System Activity Log</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Immutable record of all hub actions.
          </p>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-0">
          {mockActivityLog.length > 0 ? (
            mockActivityLog.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-4 p-5 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  {entry.user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {entry.user.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400"> {entry.action} </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {entry.resourceType}:
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {' '}
                      {entry.resource}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {entry.timestamp}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Activity size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No activity yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
