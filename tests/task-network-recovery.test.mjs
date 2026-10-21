import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the actual page handlers without a browser, database session, or
// additional test dependencies. Only their React state and transport are stubbed.
const sourcePath = process.env.XRMG_TASK_SOURCE ||
  new URL('../app/tasks/page.tsx', import.meta.url)
const source = readFileSync(sourcePath, 'utf8')

function handler(name, scope) {
  const pattern = new RegExp('  async function ' + name + '\\([^]*?\\n  }')
  const match = source.match(pattern)
  assert.ok(match, `Expected the page to define ${name}`)
  const code = stripTypeScriptTypes(match[0])
  return runInNewContext(code + '\n' + name, scope)
}

function harness(fetch, options = {}) {
  const state = {
    saving: false,
    updatingId: null,
    error: null,
    notice: null,
    title: 'Task with a stable retry key',
    priority: 'Medium',
    status: 'Next',
    dueDate: '',
    projectId: '',
    showForm: true,
    reads: 0,
  }
  const createKey = { current: 'original-idempotency-key' }
  let sequence = 0
  const scope = {
    ...state,
    createKey,
    fetch,
    crypto: { randomUUID: () => `generated-key-${++sequence}` },
    load: async () => {
      state.reads += 1
      if (options.readError) throw options.readError
    },
  }

  for (const field of Object.keys(state)) {
    scope['set' + field[0].toUpperCase() + field.slice(1)] = value => {
      state[field] = value
      scope[field] = value
    }
  }

  return {
    state,
    createKey,
    create: () => handler('createTask', scope)({ preventDefault() {} }),
    update: () => handler('updateStatus', scope)({ id: 'task-123', status: 'Next' }, 'Done'),
  }
}

const ok = () => ({ ok: true, json: async () => ({ task: { id: 'task-123' } }) })

for (const action of ['create', 'update']) {
  test(`${action}: a rejected request surfaces an error and releases the control`, async () => {
    const app = harness(async () => { throw new TypeError('Failed to fetch') })

    await assert.doesNotReject(() => app[action]())

    assert.equal(app.state.saving, false)
    assert.equal(app.state.updatingId, null)
    assert.match(app.state.error, /conexão/i)
    assert.equal(app.state.notice, null)
    assert.equal(app.state.reads, 0)
    assert.equal(app.state.title, 'Task with a stable retry key')
    assert.equal(app.state.showForm, true)
    assert.equal(app.createKey.current, 'original-idempotency-key')
  })

  test(`${action}: an HTTP error remains visible and does not report success`, async () => {
    const app = harness(async () => ({
      ok: false,
      json: async () => ({ error: 'Sessão não autorizada.' }),
    }))

    await app[action]()

    assert.equal(app.state.error, 'Sessão não autorizada.')
    assert.equal(app.state.notice, null)
    assert.equal(app.state.saving, false)
    assert.equal(app.state.updatingId, null)
    assert.equal(app.state.reads, 0)
  })

  test(`${action}: confirmed success refreshes tasks and releases the control`, async () => {
    const app = harness(async () => ok())

    await app[action]()

    assert.equal(app.state.error, null)
    assert.ok(app.state.notice)
    assert.equal(app.state.saving, false)
    assert.equal(app.state.updatingId, null)
    assert.equal(app.state.reads, 1)
  })

  test(`${action}: a rejected refresh also releases the control and clears success notice`, async () => {
    const app = harness(async () => ok(), { readError: new Error('Refresh unavailable') })

    await assert.doesNotReject(() => app[action]())

    assert.equal(app.state.saving, false)
    assert.equal(app.state.updatingId, null)
    assert.match(app.state.error, /confirmar.*operação/i)
    assert.equal(app.state.notice, null)
    assert.equal(app.state.reads, 1)
  })
}

test('create: retry after a transport failure preserves the idempotency key', async () => {
  const requests = []
  let attempt = 0
  const app = harness(async (url, options) => {
    requests.push({ url, method: options.method, body: JSON.parse(options.body) })
    if (attempt++ === 0) throw new TypeError('Failed to fetch')
    return ok()
  })

  await app.create()
  await app.create()

  assert.equal(requests.length, 2)
  assert.equal(requests[0].url, '/api/tasks')
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(requests[0].body, requests[1].body)
  assert.equal(requests[1].body.idempotency_key, 'original-idempotency-key')
  assert.equal(app.state.showForm, false)
  assert.equal(app.createKey.current, '')
  assert.equal(app.state.saving, false)
  assert.equal(app.state.reads, 1)
})
