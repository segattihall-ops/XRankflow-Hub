'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './Sidebar'
import { TopBanner } from './TopBanner'
import { Home, Inbox, CheckSquare, Bot, Menu } from 'lucide-react'

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/login'
  const isPublicQuotePage = pathname.startsWith('/turnover-quote/')
  const isUnprotectedPage = isLoginPage || isPublicQuotePage

  useEffect(() => {
    if (!loading && !user && !isUnprotectedPage) router.replace('/login')
  }, [isUnprotectedPage, loading, router, user])

  if (isPublicQuotePage) return children

  if (loading) {
    if (isLoginPage) return children
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-900 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Abrindo XRANKFLOW OS…</p>
        </div>
      </div>
    )
  }

  if (!user && isLoginPage) return children
  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-sm text-slate-500">Redirecionando para login…</p></div>
  if (isLoginPage) return children

  return (
    <>
      <TopBanner />
      <Sidebar />
      <main className="min-h-screen bg-slate-50 lg:ml-72 pb-20 lg:pb-0">{children}</main>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 grid grid-cols-5">
        <Link href="/" className="flex flex-col items-center py-2 text-[10px] text-slate-700"><Home size={19}/><span>Hoje</span></Link>
        <Link href="/inbox" className="flex flex-col items-center py-2 text-[10px] text-slate-700"><Inbox size={19}/><span>Inbox</span></Link>
        <Link href="/tasks" className="flex flex-col items-center py-2 text-[10px] text-slate-700"><CheckSquare size={19}/><span>Tarefas</span></Link>
        <Link href="/ai" className="flex flex-col items-center py-2 text-[10px] text-slate-700"><Bot size={19}/><span>IA</span></Link>
        <Link href="/integrations" className="flex flex-col items-center py-2 text-[10px] text-slate-700"><Menu size={19}/><span>Mais</span></Link>
      </nav>
    </>
  )
}
