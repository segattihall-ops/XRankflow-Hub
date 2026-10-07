'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Inbox, FolderKanban, CheckSquare, CalendarDays, Building2, Users,
  DollarSign, Megaphone, Workflow, HeartPulse, Bot, Search, Plug, ShieldCheck,
  BarChart3, FileText, Settings, BookOpen, Gavel, AlertOctagon, ClipboardCheck
} from 'lucide-react'

const sections = [
  {
    label: 'COMANDO',
    items: [
      { name: 'Hoje', href: '/', icon: Home },
      { name: 'Inbox', href: '/inbox', icon: Inbox },
      { name: 'Projetos', href: '/projects', icon: FolderKanban },
      { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
      { name: 'Calendário', href: '/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'OPERAÇÕES',
    items: [
      { name: 'Empresas', href: '/brands', icon: Building2 },
      { name: 'CRM', href: '/crm', icon: Users },
      { name: 'Financeiro', href: '/finance', icon: DollarSign },
      { name: 'Turnover Quotes', href: '/turnover-quotes', icon: ClipboardCheck },
      { name: 'Marketing', href: '/marketing', icon: Megaphone },
      { name: 'Social Media OS', href: '/social-media', icon: Megaphone },
      { name: 'Automações', href: '/automations', icon: Workflow },
      { name: 'Saúde do Sistema', href: '/health', icon: HeartPulse },
    ],
  },
  {
    label: 'INTELIGÊNCIA',
    items: [
      { name: 'AI Command Center', href: '/ai', icon: Bot },
      { name: 'Conhecimento', href: '/knowledge', icon: BookOpen },
      { name: 'Decisões', href: '/decisions', icon: Gavel },
      { name: 'Riscos', href: '/risks', icon: AlertOctagon },
      { name: 'Busca Global', href: '/search', icon: Search },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Relatórios', href: '/reports', icon: FileText },
    ],
  },
  {
    label: 'ADMINISTRAÇÃO',
    items: [
      { name: 'Aprovações', href: '/approvals', icon: ClipboardCheck },
      { name: 'Integrações', href: '/integrations', icon: Plug },
      { name: 'Pessoas & Acessos', href: '/team', icon: ShieldCheck },
      { name: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex w-72 fixed left-0 top-0 h-screen bg-slate-950 text-white overflow-y-auto pt-12 flex-col border-r border-slate-800">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white text-slate-950 flex items-center justify-center font-black">XR</div>
          <div>
            <p className="font-bold text-sm">XRANKFLOW OS</p>
            <p className="text-xs text-slate-400">Business Operating System</p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-3 py-5">
        {sections.map(section => (
          <div key={section.label} className="mb-6">
            <p className="text-[10px] tracking-[0.18em] font-bold text-slate-500 px-3 mb-2">{section.label}</p>
            <nav className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-white text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>
                    <Icon size={17} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  )
}
