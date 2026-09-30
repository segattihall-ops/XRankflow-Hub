'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  minRole: UserRole;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    minRole: 'viewer',
  },
  {
    title: 'Usuários',
    href: '/dashboard/users',
    icon: Users,
    badge: 'Admin',
    minRole: 'admin',
  },
  {
    title: 'Relatórios',
    href: '/dashboard/reports',
    icon: FileText,
    minRole: 'manager',
  },
  {
    title: 'Análises',
    href: '/dashboard/analytics',
    icon: BarChart3,
    minRole: 'viewer',
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
    minRole: 'manager',
  },
];

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    manager: 2,
    admin: 3,
  };

  const hasPermission = (minRole: UserRole) => {
    return roleHierarchy[userRole] >= roleHierarchy[minRole];
  };

  const filteredNavItems = navItems.filter(item => hasPermission(item.minRole));

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-xl font-bold">XRankFlow</h1>
          <p className="text-xs text-slate-400">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-slate-800',
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800 p-3">
          <p className="text-xs font-medium text-slate-400">Seu nível de acesso</p>
          <p className="mt-1 text-sm font-bold capitalize">{userRole}</p>
        </div>
      </div>
    </div>
  );
}
