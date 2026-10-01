import { OperationalState } from '@/components/ui/OperationalState'

export default function CRMPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">REVENUE OPERATIONS</p>
      <h1 className="text-3xl font-black mt-1">CRM Central</h1>
      <p className="text-slate-500 mt-2 mb-8">Visão federada de leads, clientes, providers, parceiros e oportunidades sem substituir CRMs especializados.</p>
      <OperationalState
        kind="not-connected"
        title="CRM federado ainda não conectado"
        description="Nenhum valor de leads, clientes ou pipeline será exibido como zero enquanto as fontes autoritativas por empresa não estiverem mapeadas. A próxima etapa é federar IDs externos e deduplicação por marca."
        source="Fonte autoritativa de CRM ainda não definida no OS"
        actionLabel="Ver fontes e integrações"
        actionHref="/integrations"
      />
    </div>
  )
}
