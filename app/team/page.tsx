'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { PersonRecord } from '@/lib/supabase'

type Membership = {
  id: string
  account_id: string
  user_id: string
  role: string
  permissions: { permissions?: string[] } | null
}

const roleMatrix = [
  { role: 'Owner', scope: 'Tudo', approve: true, manageAccess: true, write: true, read: true },
  { role: 'Admin', scope: 'Conta / empresas autorizadas', approve: true, manageAccess: true, write: true, read: true },
  { role: 'Manager', scope: 'Área / empresa', approve: true, manageAccess: false, write: true, read: true },
  { role: 'Employee', scope: 'Trabalho atribuído', approve: false, manageAccess: false, write: true, read: true },
  { role: 'Contractor', scope: 'Escopo contratado', approve: false, manageAccess: false, write: true, read: true },
  { role: 'Read Only', scope: 'Escopo autorizado', approve: false, manageAccess: false, write: false, read: true },
]

export default function TeamPage() {
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const [peopleRes, membershipRes] = await Promise.all([
          supabase.from('wh_people').select('*').order('created_at', { ascending: false }),
          authData.user
            ? supabase.from('account_members').select('id,account_id,user_id,role,permissions').eq('user_id', authData.user.id)
            : Promise.resolve({ data: [], error: null }),
        ])

        const firstError = peopleRes.error || membershipRes.error
        if (firstError) {
          setError(firstError.message)
        } else {
          setPeople((peopleRes.data || []) as PersonRecord[])
          setMemberships((membershipRes.data || []) as Membership[])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar pessoas e acessos.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredPeople = useMemo(
    () =>
      people.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.role?.toLowerCase().includes(search.toLowerCase()),
      ),
    [people, search],
  )

  const getAccessColor = (status: string): 'success' | 'info' | 'warning' | 'onhold' => {
    if (status === 'Active') return 'success'
    if (status === 'Onboarding') return 'info'
    if (status === 'Hiring') return 'warning'
    return 'onhold'
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <Card className="p-10 text-center text-slate-500">Carregando pessoas e acessos…</Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-slate-500">PESSOAS & ACESSOS</p>
          <h1 className="text-3xl font-black text-slate-950 mt-1">Equipe e permissões</h1>
          <p className="text-slate-500 mt-2">
            Diretório operacional separado da autoridade real de acesso.
          </p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pessoa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>
      </div>

      {error && (
        <Card className="p-5 border-red-200 mb-6">
          <p className="font-bold text-red-700">Não foi possível carregar toda a informação.</p>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
        </Card>
      )}

      <div className="grid xl:grid-cols-[2fr_1fr] gap-6 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <h2 className="font-bold text-xl">Diretório operacional</h2>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Fonte: <code>wh_people</code>. Estar listado aqui não concede acesso ao sistema.
          </p>

          {filteredPeople.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhuma pessoa encontrada.</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              {filteredPeople.map((person) => (
                <div key={person.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                    {person.name.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-semibold mt-3">{person.name}</h3>
                  <p className="text-sm text-slate-500">{person.role || 'Função não definida'}</p>
                  <div className="mt-3">
                    <Badge variant={getAccessColor(person.status)}>{person.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <h2 className="font-bold text-xl">Meu acesso efetivo</h2>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Fonte: <code>account_members</code> com RLS; esta tela só lê memberships do usuário autenticado.
          </p>
          <div className="mt-5 space-y-3">
            {memberships.length === 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Nenhum membership autorizado foi retornado para esta sessão.
              </div>
            ) : (
              memberships.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Conta</p>
                  <p className="font-mono text-xs break-all mt-1">{m.account_id}</p>
                  <p className="text-xs text-slate-500 mt-3">Role</p>
                  <p className="font-bold mt-1">{m.role}</p>
                  <p className="text-xs text-slate-500 mt-3">Permissões explícitas</p>
                  <p className="text-sm mt-1">
                    {m.permissions?.permissions?.length ? m.permissions.permissions.join(', ') : 'Nenhuma permissão adicional declarada'}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
            Alteração de roles permanece desabilitada até existir fluxo administrativo server-side com auditoria.
          </div>
        </Card>
      </div>

      <Card className="p-5 overflow-x-auto">
        <h2 className="font-bold text-xl">Matriz de acesso alvo</h2>
        <p className="text-sm text-slate-500 mt-2">
          Matriz operacional para o XRANKFLOW OS. A autorização futura deve usar memberships/capabilities server-side, nunca campos editáveis do perfil.
        </p>
        <table className="w-full text-sm mt-5 min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Escopo</th>
              <th className="py-3 pr-4">Leitura</th>
              <th className="py-3 pr-4">Escrita</th>
              <th className="py-3 pr-4">Aprovação</th>
              <th className="py-3">Gerenciar acessos</th>
            </tr>
          </thead>
          <tbody>
            {roleMatrix.map((row) => (
              <tr key={row.role} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-semibold">{row.role}</td>
                <td className="py-3 pr-4 text-slate-600">{row.scope}</td>
                <td className="py-3 pr-4">{row.read ? 'Sim' : 'Não'}</td>
                <td className="py-3 pr-4">{row.write ? 'Sim' : 'Não'}</td>
                <td className="py-3 pr-4">{row.approve ? 'Sim' : 'Não'}</td>
                <td className="py-3">{row.manageAccess ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
