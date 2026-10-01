'use client'

import Link from 'next/link'
import { AlertCircle, Inbox, Loader2, Plug } from 'lucide-react'
import { Card } from './Card'

export type OperationalStateKind = 'loading' | 'empty' | 'error' | 'not-connected'

type Props = {
  kind: OperationalStateKind
  title: string
  description: string
  source?: string
  actionLabel?: string
  actionHref?: string
  onRetry?: () => void
}

const iconMap = {
  loading: Loader2,
  empty: Inbox,
  error: AlertCircle,
  'not-connected': Plug,
}

const toneMap = {
  loading: 'text-slate-400',
  empty: 'text-slate-400',
  error: 'text-red-600',
  'not-connected': 'text-amber-600',
}

export function OperationalState({
  kind,
  title,
  description,
  source,
  actionLabel,
  actionHref,
  onRetry,
}: Props) {
  const Icon = iconMap[kind]
  const isLoading = kind === 'loading'

  return (
    <Card className="p-8 sm:p-10">
      <div className="max-w-2xl">
        <Icon className={`h-8 w-8 ${toneMap[kind]} ${isLoading ? 'animate-spin' : ''}`} />
        <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {source && (
          <p className="mt-4 text-xs text-slate-400">
            Fonte: <span className="font-medium text-slate-500">{source}</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tentar novamente
            </button>
          )}
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
