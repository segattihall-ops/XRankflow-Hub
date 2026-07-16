'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  MapPin,
  FolderKanban,
  Zap,
  Activity,
  PieChart,
  Users,
  BarChart3,
  Layers,
  LogOut,
  ShoppingBag,
} from 'lucide-react'

const menuItems = [
  {
    label: 'COMMAND CENTER',
    items: [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Hub Navigator', href: '/hub-navigator', icon: MapPin },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Tasks & Sprints', href: '/tasks', icon: Zap },
      { name: 'Activity Log', href: '/activity', icon: Activity },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'CRM & Pipeline', href: '/crm', icon: PieChart },
      { name: 'Finance & KPIs', href: '/finance', icon: BarChart3 },
      { name: 'Team & People', href: '/team', icon: Users },
    ],
  },
  {
    label: 'BRAND WORKSPACES',
    items: [
      { name: 'All Brands', href: '/brands', icon: ShoppingBag },
      { name: 'BayTide', href: '/brands/baytide', icon: null },
      { name: 'Bloom Cleaning', href: '/brands/bloom', icon: null },
      { name: 'Despachante USA', href: '/brands/despachante', icon: null },
      { name: 'MasseurMatch', href: '/brands/masseur', icon: null },
      { name: 'RankFlow', href: '/brands/rankflow', icon: null },
      { name: 'TPS Travel', href: '/brands/tps', icon: null },
      { name: 'Voxmation', href: '/brands/voxmation', icon: null },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-sidebar fixed left-0 top-0 h-screen bg-primary-navy text-white overflow-y-auto pt-16 flex flex-col">
      <div className="flex-1 px-4 py-6">
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
              XR
            </div>
            <span className="font-bold text-white text-sm">XRANKFLOW</span>
          </div>
          <p className="text-xs text-gray-400">COMMAND CENTER</p>
        </div>

        {/* User Card */}
        <div className="bg-gray-800 rounded-lg p-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2">
            S
          </div>
          <p className="text-sm font-semibold text-white">Segatti Hall</p>
          <p className="text-xs text-gray-400">segatti.hall@gmail.com</p>
          <div className="mt-2">
            <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded">
              Full Access
            </span>
          </div>
        </div>

        {/* Menu Sections */}
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="text-xs uppercase font-bold text-gray-500 px-2 mb-3 tracking-wide">
              {section.label}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Disconnect Button */}
      <div className="border-t border-gray-700 p-4">
        <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <LogOut size={18} />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  )
}
