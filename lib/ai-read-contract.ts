export const readCommands = ['attention', 'overdue', 'health', 'company_status', 'source_lookup'] as const
export type ReadCommand = typeof readCommands[number]

export type ReadCoverage = {
  source: string
  returned: number
  total: number
  limit: number
  partial: boolean
}

export type ReadResponse = {
  command: ReadCommand
  generated_at: string
  sources: string[]
  summary: string[]
  scope: string
  metrics: Record<string, number>
  coverage?: ReadCoverage
  details?: Record<string, unknown>
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isReadCommand(value: unknown): value is ReadCommand {
  return typeof value === 'string' && readCommands.some(command => command === value)
}

export function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

const metricKeys: Record<ReadCommand, string[]> = {
  attention: ['overdue_tasks', 'high_priority_tasks', 'at_risk_kpis', 'active_incidents'],
  overdue: ['overdue_tasks'],
  health: ['current_evidence', 'stale_evidence', 'unknown_evidence', 'active_incidents'],
  company_status: ['open_tasks', 'overdue_tasks', 'projects', 'at_risk_kpis'],
  source_lookup: ['declared_capabilities'],
}

export function isReadResponse(value: unknown, command: ReadCommand): value is ReadResponse {
  if (!isRecord(value) || value.command !== command ||
    !isTimestamp(value.generated_at) ||
    typeof value.scope !== 'string' || !value.scope.trim() ||
    !Array.isArray(value.sources) || !value.sources.length ||
    !value.sources.every(source => typeof source === 'string' && source.trim()) ||
    !Array.isArray(value.summary) || !value.summary.length ||
    !value.summary.every(line => typeof line === 'string' && line.trim()) ||
    !isRecord(value.metrics)) return false

  const metrics = value.metrics
  if (!metricKeys[command].every(key => isCount(metrics[key]))) return false

  if (command === 'health' || value.coverage !== undefined) {
    const coverage = value.coverage
    if (!isRecord(coverage) || typeof coverage.source !== 'string' || !coverage.source ||
      !isCount(coverage.returned) || !isCount(coverage.total) || !isCount(coverage.limit) ||
      coverage.limit === 0 || coverage.returned > coverage.limit || coverage.returned > coverage.total ||
      coverage.partial !== (coverage.total > coverage.returned)) return false
    if (command === 'health') {
      const current = metrics.current_evidence
      const stale = metrics.stale_evidence
      const unknown = metrics.unknown_evidence
      if (!isCount(current) || !isCount(stale) || !isCount(unknown) ||
        current + stale + unknown !== coverage.returned) return false
    }
  }
  return true
}
