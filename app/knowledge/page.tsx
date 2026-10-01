import { OperationalState } from '@/components/ui/OperationalState'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">KNOWLEDGE OS</p>
      <h1 className="text-3xl font-black mt-1">Conhecimento</h1>
      <p className="text-slate-500 mt-2 mb-8">Documentação, SOPs, políticas, arquitetura, decisões e processos vinculados à fonte oficial.</p>
      <OperationalState
        kind="not-connected"
        title="Indexação documental externa pendente"
        description="O XRANKFLOW OS não criará cópias paralelas de documentos oficiais. O Knowledge OS será habilitado quando a autoridade documental for confirmada e a indexação preservar links, versão e permissão."
        source="Repositório documental oficial ainda não conectado ao runtime"
        actionLabel="Ver fontes e integrações"
        actionHref="/integrations"
      />
    </div>
  )
}
