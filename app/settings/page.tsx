import { OperationalState } from '@/components/ui/OperationalState'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">ADMINISTRAÇÃO DO XRANKFLOW OS</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">Configurações</h1>
      <p className="text-slate-500 mt-2 mb-8">Preferências e políticas administrativas serão centralizadas aqui conforme cada configuração ganhar uma fonte e um fluxo de auditoria.</p>
      <OperationalState
        kind="not-connected"
        title="Configurações administrativas protegidas"
        description="Ainda não existem writes administrativos genéricos nesta tela. Isso evita alterações sem autorização server-side, auditoria e rollback."
        source="Nenhum service layer administrativo habilitado"
        actionLabel="Ver pessoas e acessos"
        actionHref="/team"
      />
    </div>
  )
}
