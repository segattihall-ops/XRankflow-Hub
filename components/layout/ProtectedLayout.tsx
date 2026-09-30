'use client'

import { useAuth } from '@/lib/auth-context'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBanner } from './TopBanner'

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/login')
    }
  }, [isLoginPage, loading, router, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-light dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user && isLoginPage) return children

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-light flex items-center justify-center">
        <p className="text-sm text-gray-500">Redirecionando para login…</p>
      </div>
    )
  }

  if (isLoginPage) return children

  return (
    <>
      <TopBanner />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-sidebar min-h-screen">
          {children}
        </main>
      </div>
    </>
  )
}
