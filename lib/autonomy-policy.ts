export type AutonomyMode = 'AUTO' | 'APPROVAL' | 'ADVISE' | 'BLOCKED'

export const XRMG_AUTONOMY_POLICY = {
  defaultMode: 'AUTO' as const,
  verificationRule: 'No action is counted as complete until the responsible source confirms the result.',
  approvalGates: [
    'Payments, spend, billing, or material financial commitments',
    'Legal, compliance, regulatory, or contractual changes',
    'Security, credentials, permissions, or privacy changes',
    'Destructive data/schema operations',
    'Irreversible actions or high-impact public actions',
  ],
  autoScope: 'Reversible, low-risk operational work with a verified source and post-action validation.',
}

type AutomationPolicyInput = {
  status?: string | null
  syncStatus?: string | null
  sourceEnabled?: boolean | null
  riskLevel?: string | null
  humanApproval?: string | null
}

export function getAutomationMode(input: AutomationPolicyInput): AutonomyMode {
  const status = (input.status || '').toUpperCase()
  const syncStatus = (input.syncStatus || '').toUpperCase()
  const risk = (input.riskLevel || '').toLowerCase()
  const approval = (input.humanApproval || '').toLowerCase()

  if (status === 'PAUSED' || status === 'FAILED' || input.sourceEnabled === false) return 'BLOCKED'
  if (syncStatus && syncStatus !== 'VERIFIED') return 'ADVISE'

  const explicitlyAuto =
    approval.includes('auto-execute') ||
    approval.includes('no routine approval') ||
    approval.includes('approval only for')

  if (explicitlyAuto) return 'AUTO'

  const explicitlyApproval =
    approval.includes('approval required') ||
    approval.includes('requires approval') ||
    approval.includes('human approval required')

  if (explicitlyApproval) return 'APPROVAL'
  if (risk === 'critical' || risk === 'high') return 'APPROVAL'

  return 'AUTO'
}
