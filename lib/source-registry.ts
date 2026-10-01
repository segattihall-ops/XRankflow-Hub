export type SourceState = 'connected' | 'partial' | 'pending'
export type SourceHealth = 'not_measured' | 'unknown'

export type SourceRegistryEntry = {
  key: string
  name: string
  purpose: string
  authority: string
  state: SourceState
  supportedActions: string[]
  unsupportedActions: string[]
  discoveryEvidence: string
  snapshotDate: string
  health: SourceHealth
  notes?: string
}

export const sourceRegistry: SourceRegistryEntry[] = [
  {
    key: 'github',
    name: 'GitHub',
    purpose: 'Código, pull requests, commits e histórico de engenharia',
    authority: 'Sistema de registro para código-fonte e histórico de mudanças',
    state: 'connected',
    supportedActions: ['Ler repositórios', 'Criar/atualizar arquivos', 'Criar/mesclar pull requests', 'Ler CI'],
    unsupportedActions: ['Não é autoridade para deployments', 'Não é autoridade para dados de produto'],
    discoveryEvidence: 'Repositório canônico segattihall-ops/XRankflow-Hub identificado e utilizado pelo OS',
    snapshotDate: '2026-09-30',
    health: 'not_measured',
  },
  {
    key: 'vercel',
    name: 'Vercel',
    purpose: 'Deployments, aliases e estado de produção',
    authority: 'Sistema de registro para estado de deployment do XRANKFLOW OS',
    state: 'connected',
    supportedActions: ['Ler deployments', 'Verificar READY/ERROR', 'Confirmar aliases de produção'],
    unsupportedActions: ['Não é autoridade para código-fonte', 'Não prova saúde funcional pós-deploy sem smoke check'],
    discoveryEvidence: 'Projeto x-rankflow-hub identificado; admin.xrankflow.com associado à produção',
    snapshotDate: '2026-09-30',
    health: 'not_measured',
  },
  {
    key: 'supabase-xrankflow',
    name: 'Supabase — XRANKFLOW Hub',
    purpose: 'Autenticação e dados operacionais do OS',
    authority: 'Fonte operacional para tabelas wh_* e registros XRMG atualmente conectados',
    state: 'connected',
    supportedActions: ['Auth', 'Leitura de tarefas/projetos/KPIs/financeiro operacional', 'Leitura de memberships autorizados por RLS'],
    unsupportedActions: ['Não é ledger contábil oficial', 'Não representa automaticamente dados de produtos externos'],
    discoveryEvidence: 'Projeto njwqeulzythluenexdcw verificado e utilizado pelo app',
    snapshotDate: '2026-09-30',
    health: 'not_measured',
  },
  {
    key: 'supabase-masseurmatch',
    name: 'Supabase — MasseurMatch',
    purpose: 'Dados do produto MasseurMatch',
    authority: 'Projeto de produto identificado, mas entidades ainda não federadas no OS',
    state: 'partial',
    supportedActions: ['Projeto identificado'],
    unsupportedActions: ['Sem modelo federado confirmado', 'Sem ações do produto expostas pelo XRANKFLOW OS'],
    discoveryEvidence: 'Fonte conhecida no portfólio; mapeamento de entidades pendente',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
  {
    key: 'supabase-piroka',
    name: 'Supabase — PIROKA',
    purpose: 'Dados do produto PIROKA',
    authority: 'Projeto de produto identificado, mas entidades ainda não federadas no OS',
    state: 'partial',
    supportedActions: ['Projeto identificado'],
    unsupportedActions: ['Sem modelo federado confirmado', 'Sem ações do produto expostas pelo XRANKFLOW OS'],
    discoveryEvidence: 'Fonte conhecida no portfólio; mapeamento de entidades pendente',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
  {
    key: 'email',
    name: 'Email',
    purpose: 'Universal Inbox e follow-up',
    authority: 'Autoridade de mensagens ainda não conectada ao runtime do XRANKFLOW OS',
    state: 'pending',
    supportedActions: [],
    unsupportedActions: ['Leitura', 'Envio', 'Arquivamento', 'Delegação via OS'],
    discoveryEvidence: 'Nenhum conector de email integrado à superfície operacional do app',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
  {
    key: 'calendar',
    name: 'Calendário',
    purpose: 'Agenda operacional e reuniões',
    authority: 'Autoridade de eventos externos ainda não conectada ao runtime do OS',
    state: 'pending',
    supportedActions: ['Datas de tarefas internas via wh_tasks'],
    unsupportedActions: ['Reuniões externas', 'Free/busy', 'Convites'],
    discoveryEvidence: 'Calendário atual do OS deriva somente de due dates internas',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
  {
    key: 'documents',
    name: 'Documentos oficiais',
    purpose: 'Knowledge OS, SOPs e documentos de governança',
    authority: 'Repositório documental oficial ainda precisa de confirmação operacional',
    state: 'pending',
    supportedActions: [],
    unsupportedActions: ['Busca unificada', 'Edição', 'Versionamento via OS'],
    discoveryEvidence: 'Destino documental não está ligado como fonte de runtime no app',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
  {
    key: 'accounting',
    name: 'Contabilidade / Banking',
    purpose: 'Finance OS oficial',
    authority: 'Ledger/contabilidade oficial ainda não confirmados como fonte federada',
    state: 'pending',
    supportedActions: [],
    unsupportedActions: ['Saldo oficial', 'Conciliação', 'Transações oficiais', 'Impostos'],
    discoveryEvidence: 'wh_finance é operacional e não deve ser tratado como ledger oficial',
    snapshotDate: '2026-09-30',
    health: 'unknown',
  },
]

export function sourceStateLabel(state: SourceState) {
  if (state === 'connected') return 'Conectado'
  if (state === 'partial') return 'Parcial'
  return 'Pendente'
}
