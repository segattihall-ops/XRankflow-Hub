import React from 'react'
import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: 'blue' | 'green' | 'orange' | 'red'
}

export function ProgressBar({
  value,
  max = 100,
  className,
  color = 'blue',
}: ProgressBarProps) {
  const percentage = (value / max) * 100

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
  }

  return (
    <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2', className)}>
      <div
        className={cn('h-2 rounded-full transition-all', colors[color])}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}
