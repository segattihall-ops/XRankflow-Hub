import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Compile the actual route, response contract and page. Only framework,
// session and transport boundaries are mocked; no copied handler logic.
const root = new URL('../', import.meta.url)
const now = '2026-10-21T12:00:00.000Z'
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [now])) }
  static now() { return Date.parse(now) }
}

function modules(overrides = {}, globals = {}) {
  const cache = new Map()
  function load(path) {
    if (cache.has(path)) return cache.get(path)
    const source = readFileSync(new URL(path, root), 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText
    const module = { exports: {} }
    cache.set(path, module.exports)
    runInNewContext(code, {
      module, exports: module.exports, Date: Clock, AbortController, URL, ...globals,
      require(name) {
        if (Object.hasOwn(overrides, name)) return overrides[name]
        if (['@/lib/ai-read-contract', '@/lib/source-registry'].includes(name)) return load(name.slice(2) + '.ts')
        throw new Error('Unexpected dependency: ' + name)
      },
    }, { filename: path })
    return module.exports
  }
  return load
}

const tableNames = ['wh_tasks', 'wh_kpis', 'wh_brands', 'wh_projects', 'xrmg_incident_register', 'xrmg_system_checks']
function database(rows = {}, options = {}) {
  const queries = []
  const client = {
    auth: { async getUser() {
      if (options.authThrows) throw new Error('Transport failure')
      return options.auth ?? { data: { user: { id: 'fixture-user' } }, error: null }
    } },
    from(table) {
      assert.ok(tableNames.includes(table), 'Unexpected table: ' + table)
      const query = { table, operations: [], columns: null, selectOptions: null, maximum: null }
      queries.push(query)
      const filters = []
      let single = false
      const chain = {
        select(columns, selectOptions) { query.columns = columns; query.selectOptions = selectOptions; return chain },
        or(expression) {
          assert.equal(expression, 'status.is.null,status.neq.Done')
          query.operations.push(['or', expression])
          filters.push(row => row.status == null || row.status !== 'Done')
          return chain
        },
        eq(key, value) { query.operations.push(['eq', key, value]); filters.push(row => row[key] === value); return chain },
        lt(key, value) { query.operations.push(['lt', key, value]); filters.push(row => row[key] != null && row[key] < value); return chain },
        in(key, values) { query.operations.push(['in', key, [...values]]); filters.push(row => values.includes(row[key])); return chain },
        order(key, orderOptions) { query.operations.push(['order', key, orderOptions]); return chain },
        limit(value) { query.maximum = value; return chain },
        maybeSingle() { single = true; return chain },
        then(resolve, reject) {
          if (options.rejectTable === table) return Promise.reject(new TypeError('Sensitive transport detail')).then(resolve, reject)
          if (options.errorTable === table) return Promise.resolve({ data: null, count: null, error: { message: 'Sensitive SQL detail' } }).then(resolve, reject)
          const selected = (rows[table] || []).filter(row => filters.every(filter => filter(row)))
          const count = options.missingCount === table ? null : selected.length
          const data = single ? selected[0] ?? null : query.selectOptions?.head ? null : selected.slice(0, query.maximum ?? selected.length)
          const result = options.resultFor?.(query, { data, count, error: null }) ?? { data, count, error: null }
          return Promise.resolve(result).then(resolve, reject)
        },
      }
      return chain
    },
  }
  return { client, queries }
}

function route(rows, options = {}) {
  const db = database(rows, options)
  let authClients = 0
  const load = modules({
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabase-server': { async createSupabaseServerClient() {
      authClients += 1
      if (options.clientThrows) throw new Error('Server configuration detail')
      return db.client
    } },
  })
  const { POST } = load('app/api/ai/read/route.ts')
  const contract = load('lib/ai-read-contract.ts')
  return {
    ...db, contract, authClients: () => authClients,
    async post(body, requestOptions = {}) {
      const request = new Request('https://admin.xrankflow.com/api/ai/read', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...requestOptions.headers },
        body: requestOptions.rawBody ?? JSON.stringify(body),
      })
      return POST(request)
    },
  }
}

async function payload(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  return response.json()
}

test('route: invalid input and cross-origin requests stop before auth or database access', async () => {
  for (const [body, options, status] of [
    [null, {}, 400], [[], {}, 400], [{ command: 'delete' }, {}, 400],
    [{ command: 'company_status', brand_slug: '' }, {}, 400],
    [{ command: 'company_status', brand_slug: 'x'.repeat(121) }, {}, 400],
    [{ command: 'source_lookup', source_key: [] }, {}, 400],
    [{ command: 'attention' }, { rawBody: '{invalid' }, 400],
    [{ command: 'attention' }, { headers: { Origin: 'https://untrusted.example' } }, 403],
  ]) {
    const app = route()
    assert.equal((await app.post(body, options)).status, status)
    assert.equal(app.authClients(), 0)
    assert.equal(app.queries.length, 0)
  }
})

test('route: missing or errored authentication never queries a table', async () => {
  for (const auth of [{ data: { user: null }, error: null }, { data: { user: { id: 'stale' } }, error: { message: 'expired' } }]) {
    const app = route({}, { auth })
    assert.equal((await app.post({ command: 'attention' })).status, 401)
    assert.equal(app.queries.length, 0)
  }
})

test('route: thrown auth/client errors are sanitized and recoverable', async () => {
  for (const options of [{ authThrows: true }, { clientThrows: true }]) {
    const app = route({}, options)
    const response = await app.post({ command: 'attention' })
    assert.equal(response.status, 503)
    assert.deepEqual(Object.keys(await payload(response)), ['error'])
    assert.equal(app.queries.length, 0)
  }
})

const tasks = [
  { id: '1', status: 'Next', due_date: '2026-10-20', priority: 'High', brand_id: 'brand-a' },
  { id: '2', status: 'Done', due_date: '2026-10-19', priority: 'High', brand_id: 'brand-a' },
  { id: '3', status: 'In Progress', due_date: '2026-10-21', priority: 'Low', brand_id: 'brand-a' },
  { id: '4', status: null, due_date: '2026-10-18', priority: 'High', brand_id: 'brand-b' },
  { id: '5', status: 'Next', due_date: null, priority: 'High', brand_id: 'brand-b' },
]

test('route: overdue excludes Done, null due dates and today; includes unclassified unfinished status', async () => {
  const app = route({ wh_tasks: tasks })
  const response = await app.post({ command: 'overdue' })
  assert.equal(response.status, 200)
  const data = await payload(response)
  assert.equal(data.metrics.overdue_tasks, 2)
  assert.equal(app.contract.isReadResponse(data, 'overdue'), true)
  assert.equal(app.queries[0].selectOptions.count, 'exact')
  assert.equal(app.queries[0].selectOptions.head, true)
  assert.equal(app.queries[0].maximum, null)
  assert.match(data.scope, /sessão.*UTC/)
})

test('route: attention counts beyond former row limits and filters current incident constraint values', async () => {
  const many = Array.from({ length: 350 }, (_, i) => ({ ...tasks[0], id: String(i) }))
  const app = route({ wh_tasks: many, wh_kpis: [{ health: 'At Risk' }, { health: 'Off Track' }, { health: 'On Track' }],
    xrmg_incident_register: ['OPEN', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'].map(status => ({ status })) })
  const data = await payload(await app.post({ command: 'attention' }))
  assert.deepEqual(data.metrics, { overdue_tasks: 350, high_priority_tasks: 350, at_risk_kpis: 2, active_incidents: 3 })
  assert.equal(app.contract.isReadResponse(data, 'attention'), true)
  assert.ok(app.queries.every(query => query.selectOptions.count === 'exact' && query.selectOptions.head && query.maximum === null))
  assert.ok(app.queries.every(query => query.columns === 'id'))
})

test('route: company resolution scopes every aggregate to its authorized brand ID', async () => {
  const app = route({ wh_tasks: tasks, wh_brands: [{ id: 'brand-a', slug: 'company-a', name: 'Company A' }],
    wh_projects: [{ brand_id: 'brand-a' }, { brand_id: 'brand-b' }],
    wh_kpis: [{ brand_id: 'brand-a', health: 'At Risk' }, { brand_id: 'brand-b', health: 'At Risk' }] })
  const data = await payload(await app.post({ command: 'company_status', brand_slug: ' COMPANY-A ', brand_id: 'brand-b' }))
  assert.deepEqual(data.metrics, { open_tasks: 2, overdue_tasks: 1, projects: 1, at_risk_kpis: 1 })
  assert.equal(app.contract.isReadResponse(data, 'company_status'), true)
  assert.ok(app.queries.slice(1).every(query => query.operations.some(op => op[0] === 'eq' && op[1] === 'brand_id' && op[2] === 'brand-a')))
})

test('route: unknown company returns 404 before any company aggregate', async () => {
  const app = route()
  assert.equal((await app.post({ command: 'company_status', brand_slug: 'absent' })).status, 404)
  assert.deepEqual(app.queries.map(query => query.table), ['wh_brands'])
})

function check(id, overrides = {}) {
  return { id, system_key: 'fixture', check_key: id, status: 'FAIL', checked_at: '2026-10-21T11:00:00Z',
    expires_at: '2026-10-21T13:00:00Z', ...overrides }
}

test('route: health distinguishes valid, expired, absent, malformed and future evidence', async () => {
  const checks = [check('current'), check('expired', { expires_at: now }),
    check('null', { expires_at: null }), check('invalid', { expires_at: 'nonsense' }),
    check('partial-date', { expires_at: '3000' }),
    check('future', { checked_at: '2026-10-22T11:00:00Z', expires_at: '2026-10-22T13:00:00Z' }),
    check('reversed', { expires_at: '2026-10-20T12:00:00Z' })]
  const app = route({ xrmg_system_checks: checks })
  const data = await payload(await app.post({ command: 'health' }))
  assert.deepEqual(data.metrics, { current_evidence: 1, stale_evidence: 1, unknown_evidence: 5, active_incidents: 0 })
  assert.equal(data.details.checks[0].status, 'FAIL')
  assert.equal(data.details.checks[0].freshness, 'current')
  assert.equal(app.contract.isReadResponse(data, 'health'), true)
})

test('route: zero health rows means unknown health, never a healthy dashboard', async () => {
  const app = route()
  const data = await payload(await app.post({ command: 'health' }))
  assert.match(data.summary.join(' '), /saúde atual desconhecida/)
  assert.equal(data.metrics.current_evidence, 0)
  assert.equal(data.coverage.total, 0)
})

test('route: bounded health results expose total and partial coverage without inflating current counts', async () => {
  const app = route({ xrmg_system_checks: Array.from({ length: 251 }, (_, i) => check('check-' + i)) })
  const data = await payload(await app.post({ command: 'health' }))
  assert.deepEqual(data.coverage, { source: 'xrmg_system_checks', returned: 200, total: 251, limit: 200, partial: true })
  assert.equal(data.metrics.current_evidence, 200)
  assert.match(data.summary.join(' '), /cobertura parcial.*entre os registros consultados/)
  assert.equal(app.contract.isReadResponse(data, 'health'), true)
})

test('route: source lookup declares historical catalog evidence, not live tool capability', async () => {
  const app = route()
  const response = await app.post({ command: 'source_lookup', source_key: 'github' })
  const data = await payload(response)
  assert.equal(response.status, 200)
  assert.equal(app.contract.isReadResponse(data, 'source_lookup'), true)
  assert.match(data.scope, /Snapshot documental.*não verifica/)
  assert.match(data.summary[0], /2026-09-30/)
  assert.equal(app.queries.length, 0)
  assert.equal((await app.post({ command: 'source_lookup', source_key: 'invented' })).status, 404)
})

test('route: source rejection, SDK error or absent exact count cannot produce a successful summary', async () => {
  for (const options of [{ rejectTable: 'wh_tasks' }, { errorTable: 'wh_tasks' }, { missingCount: 'wh_tasks' }]) {
    const app = route({ wh_tasks: tasks }, options)
    const response = await app.post({ command: 'attention' })
    assert.equal(response.status, 503)
    const data = await payload(response)
    assert.deepEqual(Object.keys(data), ['error'])
    assert.doesNotMatch(data.error, /Sensitive|SQL|Transport/)
  }
})

test('route: malformed health responses remain unavailable rather than zero or current', async () => {
  for (const bad of [{ data: null, count: 0 }, { data: {}, count: 1 }, { data: [], count: 2 },
    { data: [{}], count: 1 }, { data: [check('a')], count: null }, { data: [check('a')], count: 0 }]) {
    const app = route({}, { resultFor: (query, result) => query.table === 'xrmg_system_checks' ? { ...bad, error: null } : result })
    assert.equal((await app.post({ command: 'health' })).status, 503)
  }
})

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function client(fetch, brandResult = async () => ({ data: [{ id: 'a', name: 'Company A', slug: 'company-a' },
  { id: 'b', name: 'Company B', slug: 'company-b' }], error: null })) {
  const hooks = []
  let cursor = 0
  let tree
  let mounted = true
  let lateWrites = 0
  const pendingEffects = []
  const React = {
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = { value: typeof initial === 'function' ? initial() : initial }
      return [hooks[index].value, value => {
        if (!mounted) lateWrites += 1
        hooks[index].value = typeof value === 'function' ? value(hooks[index].value) : value
      }]
    },
    useRef(initial) { const index = cursor++; hooks[index] ??= { current: initial }; return hooks[index] },
    useCallback(callback) { const index = cursor++; hooks[index] ??= callback; return hooks[index] },
    useEffect(effect) {
      const index = cursor++
      if (!(index in hooks)) { hooks[index] = {}; pendingEffects.push(() => { hooks[index].cleanup = effect() }) }
    },
  }
  const jsx = (type, props, key) => ({ type, props: props || {}, key })
  const load = modules({
    react: React, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'lucide-react': { Search: 'Search' },
    '@/components/ui/Button': { Button: 'Button' }, '@/components/ui/Card': { Card: 'Card' },
    '@/components/ui/OperationalState': { OperationalState: 'OperationalState' },
    '@/lib/supabase': { supabase: { from(table) {
      assert.equal(table, 'wh_brands')
      const query = { select() { return query }, order() { return query }, then(resolve, reject) { return brandResult().then(resolve, reject) } }
      return query
    } } },
  }, { fetch })
  const Page = load('app/ai/page.tsx').default
  function render() {
    cursor = 0
    tree = Page()
    while (pendingEffects.length) pendingEffects.shift()()
    return tree
  }
  function nodes(node) {
    if (arguments.length === 0) node = tree
    if (Array.isArray(node)) return node.flatMap(item => nodes(item))
    if (!node || typeof node !== 'object') return []
    return [node, ...nodes(node.props?.children)]
  }
  function find(predicate) { const found = nodes().find(predicate); assert.ok(found, 'Expected UI node'); return found }
  function text(node) {
    if (arguments.length === 0) node = tree
    if (Array.isArray(node)) return node.map(item => text(item)).join(' ')
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    return node && typeof node === 'object' ? text(node.props?.children) : ''
  }
  render()
  return {
    render, text,
    async flush() { await new Promise(resolve => setImmediate(resolve)); render() },
    execute() { find(node => node.type === 'Button').props.onClick() },
    selectCommand(label) { find(node => node.type === 'button' && node.props.children === label).props.onClick(); render() },
    select(id, value) { find(node => node.type === 'select' && node.props.id === id).props.onChange({ target: { value } }); render() },
    button: () => find(node => node.type === 'Button'),
    errors: () => nodes().filter(node => node.type === 'OperationalState' && node.props.kind === 'error'),
    loading: () => nodes().some(node => node.type === 'OperationalState' && node.props.kind === 'loading'),
    hasResult: () => text().includes('RESULTADO DA CONSULTA'),
    unmount() { for (const hook of hooks) hook?.cleanup?.(); mounted = false },
    lateWrites: () => lateWrites,
  }
}

function ok(command = 'attention', overrides = {}) {
  const data = { command, generated_at: now, sources: ['wh_tasks'], scope: 'Visible fixture records.',
    summary: ['Verified fixture summary'], metrics: command === 'attention' ?
      { overdue_tasks: 1, high_priority_tasks: 1, at_risk_kpis: 0, active_incidents: 0 } :
      command === 'overdue' ? { overdue_tasks: 2 } :
      command === 'company_status' ? { open_tasks: 1, overdue_tasks: 0, projects: 1, at_risk_kpis: 0 } :
      { declared_capabilities: 2 }, ...overrides }
  return { ok: true, json: async () => data }
}

test('client: network failure releases loading, exposes retry and preserves the selected query', async () => {
  const requests = []
  const app = client(async (url, options) => { requests.push(JSON.parse(options.body)); throw new TypeError('Failed to fetch') })
  await app.flush()
  app.selectCommand('Tarefas atrasadas')
  app.execute()
  await app.flush()
  assert.equal(app.loading(), false)
  assert.equal(app.button().props.disabled, false)
  assert.equal(app.hasResult(), false)
  assert.match(app.errors()[0].props.description, /conexão/)
  app.errors()[0].props.onRetry()
  await app.flush()
  assert.equal(requests.length, 2)
  assert.deepEqual(requests[0], requests[1])
  assert.equal(requests[0].command, 'overdue')
})

test('client: HTTP error and malformed success never present a verified result', async () => {
  const bad = [
    { ok: false, json: async () => ({ error: 'Sessão não autorizada.' }) },
    { ok: true, json: async () => { throw new SyntaxError('Broken JSON') } },
    ...[null, {}, [], { command: 'attention' }].map(value => ({ ok: true, json: async () => value })),
    ok('overdue'), ok('attention', { generated_at: 'nonsense' }), ok('attention', { generated_at: '1' }), ok('attention', { summary: [] }),
    ok('attention', { sources: [3] }), ok('attention', { metrics: { overdue_tasks: -1 } }),
  ]
  for (const response of bad) {
    const app = client(async () => response)
    await app.flush(); app.execute(); await app.flush()
    assert.equal(app.loading(), false)
    assert.equal(app.hasResult(), false)
    assert.equal(app.errors().length, 1)
    assert.equal(app.button().props.disabled, false)
  }
})

test('client: a successful retry renders the actual route contract and clears prior errors', async () => {
  const api = route({ wh_tasks: tasks })
  let attempt = 0
  const app = client(async (url, options) => {
    assert.equal(url, '/api/ai/read')
    assert.equal(options.method, 'POST')
    if (!attempt++) throw new TypeError('Offline')
    return api.post(JSON.parse(options.body))
  })
  await app.flush(); app.execute(); await app.flush()
  app.errors()[0].props.onRetry(); await app.flush()
  assert.equal(app.errors().length, 0)
  assert.equal(app.hasResult(), true)
  assert.equal(app.loading(), false)
  assert.match(app.text(), /2 tarefa\(s\) vencida/)
})

test('client: changing command aborts and ignores an old response even if transport ignores abort', async () => {
  const old = deferred(), current = deferred()
  const signals = []
  const app = client(async (url, options) => { signals.push(options.signal); return signals.length === 1 ? old.promise : current.promise })
  await app.flush(); app.execute(); await app.flush()
  app.selectCommand('Tarefas atrasadas'); app.execute(); await app.flush()
  assert.equal(signals[0].aborted, true)
  old.resolve(ok('attention')); await app.flush()
  assert.equal(app.hasResult(), false)
  assert.equal(app.loading(), true)
  current.resolve(ok('overdue', { summary: ['Current overdue query'] })); await app.flush()
  assert.equal(app.hasResult(), true)
  assert.match(app.text(), /Current overdue query/)
  assert.equal(app.loading(), false)
})

test('client: a late failure cannot overwrite a newer successful result', async () => {
  const old = deferred()
  let attempt = 0
  const app = client(async () => attempt++ ? ok('overdue') : old.promise)
  await app.flush(); app.execute(); app.selectCommand('Tarefas atrasadas'); app.execute(); await app.flush()
  old.reject(new TypeError('Late offline error')); await app.flush()
  assert.equal(app.hasResult(), true)
  assert.equal(app.errors().length, 0)
})

test('client: changing company or catalog source clears and invalidates old results', async () => {
  for (const [label, id, value, command] of [
    ['Status da empresa', 'ai-company', 'company-b', 'company_status'],
    ['Fonte de verdade', 'ai-source', 'vercel', 'source_lookup'],
  ]) {
    const pending = deferred()
    const app = client(async () => pending.promise)
    await app.flush(); app.selectCommand(label); app.execute(); await app.flush()
    app.select(id, value)
    pending.resolve(ok(command)); await app.flush()
    assert.equal(app.hasResult(), false)
    assert.equal(app.loading(), false)
    assert.equal(app.errors().length, 0)
  }
})

test('client: brand-loading failures are recoverable and do not block unrelated commands', async () => {
  let attempt = 0
  const app = client(async () => ok(), async () => {
    if (!attempt++) throw new TypeError('Brand transport failure')
    return { data: [{ id: 'a', name: 'Company A', slug: 'company-a' }], error: null }
  })
  await app.flush()
  assert.equal(app.button().props.disabled, false)
  app.selectCommand('Status da empresa')
  assert.equal(app.button().props.disabled, true)
  assert.equal(app.errors().length, 1)
  app.errors()[0].props.onRetry(); await app.flush()
  assert.equal(app.errors().length, 0)
  assert.equal(app.button().props.disabled, false)
})

test('client: malformed brand payloads and SDK errors cannot enable a company query', async () => {
  for (const result of [{ data: null, error: null }, { data: [{}], error: null }, { data: [], error: { message: 'denied' } }]) {
    const app = client(async () => ok(), async () => result)
    await app.flush(); app.selectCommand('Status da empresa')
    assert.equal(app.button().props.disabled, true)
    assert.equal(app.errors().length, 1)
  }
})

test('client: unmount aborts pending reads and ignores late brand/query completions', async () => {
  const brands = deferred(), query = deferred()
  let signal
  const app = client(async (url, options) => { signal = options.signal; return query.promise }, async () => brands.promise)
  app.execute(); app.unmount()
  assert.equal(signal.aborted, true)
  brands.resolve({ data: [], error: null }); query.resolve(ok())
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(app.lateWrites(), 0)
})

test('contract: missing or inconsistent health coverage is rejected', () => {
  const contract = modules()('lib/ai-read-contract.ts')
  const base = { command: 'health', generated_at: now, scope: 'Scoped.', sources: ['xrmg_system_checks'], summary: ['Observed.'],
    metrics: { current_evidence: 1, stale_evidence: 0, unknown_evidence: 0, active_incidents: 0 } }
  for (const coverage of [undefined, { source: 'xrmg_system_checks', returned: 1, total: 2, limit: 200, partial: false },
    { source: 'xrmg_system_checks', returned: 2, total: 2, limit: 200, partial: false }]) {
    assert.equal(contract.isReadResponse({ ...base, coverage }, 'health'), false)
  }
})
