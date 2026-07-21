import React from 'react'
import { cn } from '@/utils/cn'

type BadgeVariant = 'active' | 'high' | 'medium' | 'low' | 'onhold' | 'success' | 'info' | 'warning'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function Badge({ variant = 'info', children, icon, className }: BadgeProps) {
  const variants = {
    active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    onhold: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
