'use client'

import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { PersonRecord } from '@/lib/supabase'

export default function TeamPage() {
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const { data, error } = await supabase
          .from('wh_people')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPeople(data || [])
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPeople()
  }, [])

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.role?.toLowerCase().includes(search.toLowerCase())
  )

  const getAccessColor = (status: string) => {
    if (status === 'Active') return 'success'
    if (status === 'Onboarding') return 'info'
    if (status === 'Hiring') return 'warning'
    return 'onhold'
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-10 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando equipe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="section-label">PEOPLE</p>
            <h1 className="section-title mb-2">Team Directory</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredPeople.length} membr{filteredPeople.length === 1 ? 'o' : 'os'} da equipe
            </p>
          </div>
          <div className="relative w-64">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar na equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Team Grid */}
        {filteredPeople.length === 0 ? (
          <Card className="text-center py-16">
            <Users size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum membro encontrado
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar sua busca
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPeople.map((person) => (
              <Card key={person.id} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  {person.name.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                  {person.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{person.role}</p>
                {person.contact && (
                  <a
                    href={`mailto:${person.contact}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline block mb-3"
                  >
                    {person.contact}
                  </a>
                )}
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-semibold">
                  Status
                </p>
                <Badge variant={getAccessColor(person.status) as any}>
                  {person.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
