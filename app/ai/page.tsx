import { OperationalState } from '@/components/ui/OperationalState'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">COMANDOS EM LINGUAGEM NATURAL</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">AI Command Center</h1>
      <p className="text-slate-500 mt-2 mb-8">A IA só poderá usar ferramentas autorizadas e nunca declarará uma ação concluída sem confirmação da fonte responsável.</p>
      <OperationalState
        kind="not-connected"
        title="Gateway de ferramentas ainda não habilitado"
        description="A interface está reservada, mas os comandos read-only e os writes protegidos ainda precisam do service layer com capability checks, auditoria, idempotência e verificação pós-ação."
        source="AI tool gateway ainda não implementado no runtime do app"
        actionLabel="Ver backlog operacional"
        actionHref="/projects"
      />
    </div>
  )
}
