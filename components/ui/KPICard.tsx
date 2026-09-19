import React from 'react'
import { cn } from '@/utils/cn'

interface KPICardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'purple' | 'blue' | 'green' | 'orange'
  className?: string
}

export function KPICard({
  label,
  value,
  icon,
  color = 'blue',
  className,
}: KPICardProps) {
  const colors = {
    purple: 'bg-purple-600 dark:bg-purple-700',
    blue: 'bg-blue-600 dark:bg-blue-700',
    green: 'bg-green-600 dark:bg-green-700',
    orange: 'bg-orange-600 dark:bg-orange-700',
  }

  return (
    <div
      className={cn(
        'rounded-lg p-6 text-white min-h-[120px] flex flex-col justify-between',
        colors[color],
        className
      )}
    >
      <div>
        <p className="text-xs uppercase font-semibold opacity-90">{label}</p>
      </div>
      <div className="flex justify-between items-end">
        <div className="text-5xl font-bold">{value}</div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
    </div>
  )
}
