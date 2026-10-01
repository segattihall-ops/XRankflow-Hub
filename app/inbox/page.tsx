import { OperationalState } from '@/components/ui/OperationalState'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">CAIXA OPERACIONAL CENTRAL</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">Inbox</h1>
      <p className="text-slate-500 mt-2 mb-8">Email, suporte, leads e notificações serão consolidados aqui conforme as fontes autoritativas forem conectadas.</p>
      <OperationalState
        kind="not-connected"
        title="Universal Inbox ainda não conectada"
        description="O XRANKFLOW OS não vai inventar mensagens nem tratar ausência de conector como caixa vazia. A primeira versão será habilitada quando uma fonte de email/suporte estiver conectada com IDs de origem preservados."
        source="Nenhum conector de inbox ativo no runtime do OS"
        actionLabel="Ver fontes e integrações"
        actionHref="/integrations"
      />
    </div>
  )
}
