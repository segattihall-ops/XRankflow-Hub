import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Run the page's actual handlers with stubbed React state/transport. No browser,
// database credentials, or additional test dependency is required.
const sourcePath = process.env.XRMG_TASK_SOURCE ||
  new URL('../app/tasks/page.tsx', import.meta.url)
const source = readFileSync(sourcePath, 'utf8')

function handler(name, scope) {
  const pattern = new RegExp('  async function ' + name + '\\([^]*?\\n  }')
  const match = source.match(pattern)
  assert.ok(match, 'Expected the page to define ' + name)
  const acknowledgement = source.match(/function hasTaskAcknowledgement\([^]*?\n}/)?.[0] || ''
  const code = stripTypeScriptTypes(acknowledgement + '\n' + match[0])
  return runInNewContext(code + '\n' + name, scope)
}

function row(status = 'Next') {
  return { id: 'task-123', title: 'Task with a stable retry key', status }
}

function ok(status = 'Next', array = false) {
  return { ok: true, json: async () => ({ task: array ? [row(status)] : row(status) }) }
}

function harness(fetch, options = {}) {
  const state = {
    saving: false, updatingId: null, loading: false, error: null, notice: null,
    title: 'Task with a stable retry key', priority: 'Medium', status: 'Next',
    dueDate: '', projectId: '', showForm: true, reads: 0,
    tasks: [row()], projects: [], audit: [],
  }
  const createKey = { current: 'original-idempotency-key' }
  let sequence = 0
  const scope = {
    ...state,
    createKey,
    fetch,
    crypto: { randomUUID: () => 'generated-key-' + ++sequence },
    load: async () => {
      state.reads += 1
      if (options.readError) throw options.readError
      return options.readResult ?? true
    },
    supabase: {
      from(table) {
        const query = {
          select() { return query },
          order() { return query },
          limit() { return query },
          then(resolve, reject) {
            if (options.queryError) return Promise.reject(options.queryError).then(resolve, reject)
            const result = options.queryResult ?? { data: [], error: null }
            return Promise.resolve(result).then(resolve, reject)
          },
        }
        assert.ok(['wh_tasks', 'wh_projects', 'xrmg_task_audit_log'].includes(table))
        return query
      },
    },
  }
  for (const field of Object.keys(state)) {
    scope['set' + field[0].toUpperCase() + field.slice(1)] = value => {
      state[field] = value
      scope[field] = value
    }
  }
  return {
    state, createKey,
    create: () => handler('createTask', scope)({ preventDefault() {} }),
    update: () => handler('updateStatus', scope)({ id: 'task-123', status: 'Next' }, 'Done'),
    load: () => handler('load', scope)(),
  }
}

function expectUnconfirmed(app) {
  assert.equal(app.state.saving, false)
  assert.equal(app.state.updatingId, null)
  assert.match(app.state.error, /confirmar.*operação/i)
  assert.equal(app.state.notice, null)
  assert.equal(app.state.reads, 0)
  assert.equal(app.state.title, 'Task with a stable retry key')
  assert.equal(app.state.showForm, true)
  assert.equal(app.createKey.current, 'original-idempotency-key')
}

for (const action of ['create', 'update']) {
  const status = action === 'create' ? 'Next' : 'Done'

  test(action + ': a rejected request releases the control and preserves retry state', async () => {
    const app = harness(async () => { throw new TypeError('Failed to fetch') })
    await assert.doesNotReject(() => app[action]())
    expectUnconfirmed(app)
  })

  test(action + ': an HTTP error remains visible without success feedback', async () => {
    const app = harness(async () => ({
      ok: false, json: async () => ({ error: 'Sessão não autorizada.' }),
    }))
    await app[action]()
    assert.equal(app.state.error, 'Sessão não autorizada.')
    assert.equal(app.state.notice, null)
    assert.equal(app.state.saving, false)
    assert.equal(app.state.updatingId, null)
    assert.equal(app.state.reads, 0)
  })

  for (const array of [false, true]) {
    test(action + ': a single ' + (array ? 'array' : 'object') + ' acknowledgement confirms and refreshes', async () => {
      const app = harness(async () => ok(status, array))
      await app[action]()
      assert.equal(app.state.error, null)
      assert.ok(app.state.notice)
      assert.equal(app.state.saving, false)
      assert.equal(app.state.updatingId, null)
      assert.equal(app.state.reads, 1)
    })
  }

  for (const options of [{ readError: new Error('Refresh unavailable') }, { readResult: false }]) {
    test(action + ': a failed refresh preserves confirmed-write feedback', async () => {
      const app = harness(async () => ok(status), options)
      await assert.doesNotReject(() => app[action]())
      assert.equal(app.state.saving, false)
      assert.equal(app.state.updatingId, null)
      assert.match(app.state.error, /lista.*atualizada.*[Rr]ecarregue/i)
      assert.doesNotMatch(app.state.error, /tente novamente|confirmar a operação/i)
      assert.ok(app.state.notice)
      assert.equal(app.state.reads, 1)
      if (action === 'create') {
        assert.equal(app.state.showForm, false)
        assert.equal(app.state.title, '')
        assert.equal(app.createKey.current, '')
      }
    })
  }

  test(action + ': HTTP success with malformed JSON remains unconfirmed', async () => {
    const app = harness(async () => ({
      ok: true, json: async () => { throw new SyntaxError('Malformed JSON') },
    }))
    await app[action]()
    expectUnconfirmed(app)
  })

  test(action + ': missing, empty, multiple, or invalid rows remain unconfirmed', async () => {
    for (const task of [undefined, null, [], [row(status), row(status)], {},
      { ...row(status), id: '' }, { ...row(status), title: '' }, row('Wrong status')]) {
      const app = harness(async () => ({ ok: true, json: async () => ({ task }) }))
      await app[action]()
      expectUnconfirmed(app)
    }
  })
}

test('update: an acknowledgement for a different task remains unconfirmed', async () => {
  const app = harness(async () => ({
    ok: true, json: async () => ({ task: { ...row('Done'), id: 'another-task' } }),
  }))
  await app.update()
  expectUnconfirmed(app)
})

for (const failure of ['transport', 'unknown acknowledgement']) {
  test('create: retry after ' + failure + ' preserves the idempotency key', async () => {
    const requests = []
    let attempt = 0
    const app = harness(async (url, options) => {
      requests.push({ url, method: options.method, body: JSON.parse(options.body) })
      if (attempt++ === 0) {
        if (failure === 'transport') throw new TypeError('Failed to fetch')
        return { ok: true, json: async () => ({}) }
      }
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
}

test('load: a rejected query releases loading and preserves the visible tasks', async () => {
  const app = harness(undefined, { queryError: new TypeError('Failed to fetch') })
  const previousTasks = app.state.tasks
  assert.equal(await app.load(), false)
  assert.equal(app.state.loading, false)
  assert.equal(app.state.tasks, previousTasks)
  assert.match(app.state.error, /carregar.*tarefas/i)
})

test('load: a resolved SDK error reports failure and preserves visible tasks', async () => {
  const app = harness(undefined, { queryResult: { data: null, error: { message: 'Read unavailable' } } })
  const previousTasks = app.state.tasks
  assert.equal(await app.load(), false)
  assert.equal(app.state.loading, false)
  assert.equal(app.state.tasks, previousTasks)
  assert.equal(app.state.error, 'Read unavailable')
})
