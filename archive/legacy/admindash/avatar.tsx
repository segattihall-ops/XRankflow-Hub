'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, TrendingUp, Shield } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total de Usuários',
      value: '2,543',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Atividade Hoje',
      value: '847',
      change: '+8%',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Taxa de Crescimento',
      value: '24.5%',
      change: '+4%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Segurança',
      value: '99.9%',
      change: 'Ótimo',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const recentActivities = [
    { user: 'João Silva', action: 'Criou novo relatório', time: '5 min atrás' },
    { user: 'Maria Santos', action: 'Atualizou configurações', time: '12 min atrás' },
    { user: 'Pedro Oliveira', action: 'Fez login no sistema', time: '23 min atrás' },
    { user: 'Ana Costa', action: 'Exportou dados', time: '1 hora atrás' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu sistema - Nível de acesso:{' '}
          <Badge variant="outline" className="capitalize">{user?.role}</Badge>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} comparado ao mês anterior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Permissões do seu Perfil</CardTitle>
            <CardDescription>
              O que você pode fazer como {user?.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.role === 'admin' && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Gerenciar usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Acessar todas as configurações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Visualizar relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Controle total do sistema</span>
                  </div>
                </>
              )}
              {user?.role === 'manager' && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Criar relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Gerenciar configurações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Visualizar análises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">✗</Badge>
                    <span className="text-sm text-muted-foreground">Gerenciar usuários</span>
                  </div>
                </>
              )}
              {user?.role === 'viewer' && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Visualizar dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">✓</Badge>
                    <span className="text-sm">Ver análises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">✗</Badge>
                    <span className="text-sm text-muted-foreground">Criar relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">✗</Badge>
                    <span className="text-sm text-muted-foreground">Gerenciar usuários</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
