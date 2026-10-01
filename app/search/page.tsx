import { OperationalState } from '@/components/ui/OperationalState'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">PESQUISA UNIVERSAL</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">Busca Global</h1>
      <p className="text-slate-500 mt-2 mb-8">Busca permission-aware em empresas, projetos, pessoas, tarefas, documentos, decisões, campanhas, automações e sistemas.</p>
      <OperationalState
        kind="not-connected"
        title="Índice global ainda não construído"
        description="As fontes atuais continuam acessíveis em seus módulos próprios. A busca unificada será ativada quando o índice puder preservar source IDs, permissões e atualização por fonte."
        source="Índice de busca federada ainda não conectado"
        actionLabel="Ver fontes e integrações"
        actionHref="/integrations"
      />
    </div>
  )
}
