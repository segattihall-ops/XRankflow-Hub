'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function TopBanner() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
      <p className="text-sm font-medium">
        🚀 Running on Replit — This is your XRANKFLOW Command Center
      </p>
      <button
        onClick={() => setVisible(false)}
        className="hover:bg-blue-700 p-1 rounded transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  )
}
