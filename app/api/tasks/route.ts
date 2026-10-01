import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const priorities = new Set(['High', 'Medium', 'Low'])
const statuses = new Set(['Inbox', 'Next', 'In Progress', 'Waiting', 'Done', 'Parked'])

async function getSupabase() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njwqeulzythluenexdcw.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq'

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(items) {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function cleanText(value: unknown, max = 240) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })

  const title = cleanText(body.title)
  const priority = cleanText(body.priority, 20)
  const status = cleanText(body.status, 30)
  const projectId = cleanText(body.project_id, 80) || null
  const dueDate = cleanText(body.due_date, 10) || null
  const idempotencyKey = cleanText(body.idempotency_key, 100) || null

  if (title.length < 2) return NextResponse.json({ error: 'Informe um título válido.' }, { status: 400 })
  if (!priorities.has(priority)) return NextResponse.json({ error: 'Prioridade inválida.' }, { status: 400 })
  if (!statuses.has(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ error: 'Prazo inválido.' }, { status: 400 })
  }

  const supabase = await getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Sessão não autorizada.' }, { status: 401 })

  const { data, error } = await supabase.rpc('xrmg_create_task', {
    p_title: title,
    p_priority: priority,
    p_status: status,
    p_due_date: dueDate,
    p_project_id: projectId,
    p_area: 'Operations',
    p_owner_role: 'CEO',
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    const message =
      error.message.includes('not_authorized') ? 'Você não tem permissão para criar tarefas.' :
      error.message.includes('invalid_project') ? 'O projeto selecionado não é válido.' :
      'Não foi possível criar a tarefa.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ task: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })

  const taskId = cleanText(body.task_id, 80)
  const status = cleanText(body.status, 30)
  const idempotencyKey = cleanText(body.idempotency_key, 100) || null

  if (!taskId) return NextResponse.json({ error: 'Tarefa inválida.' }, { status: 400 })
  if (!statuses.has(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })

  const supabase = await getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'Sessão não autorizada.' }, { status: 401 })

  const { data, error } = await supabase.rpc('xrmg_update_task_status', {
    p_task_id: taskId,
    p_status: status,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    const message =
      error.message.includes('not_authorized') ? 'Você não tem permissão para alterar tarefas.' :
      error.message.includes('task_not_found') ? 'Tarefa não encontrada.' :
      'Não foi possível atualizar a tarefa.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ task: data })
}
