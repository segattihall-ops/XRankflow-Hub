import { Card } from '@/components/ui/Card'
import { sourceRegistry, sourceStateLabel } from '@/lib/source-registry'

const tone = {
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function Page() {
  const counts = sourceRegistry.reduce(
    (acc, item) => {
      acc[item.state] += 1
      return acc
    },
    { connected: 0, partial: 0, pending: 0 },
  )

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">GOVERNANÇA DE FONTES</p>
      <h1 className="text-3xl font-black mt-1">Integrações & Fontes de Verdade</h1>
      <p className="text-slate-500 mt-2 mb-8">
        Registro explícito de autoridade, capacidades e lacunas. Estado de conexão não é usado como sinônimo de saúde.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Summary label="Conectadas" value={counts.connected} />
        <Summary label="Parciais" value={counts.partial} />
        <Summary label="Pendentes" value={counts.pending} />
      </div>

      <div className="space-y-4">
        {sourceRegistry.map((item) => (
          <Card key={item.key} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-bold text-lg">{item.name}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tone[item.state]}`}>
                    {sourceStateLabel(item.state)}
                  </span>
                  <span className="text-xs text-slate-400">Saúde: não medida</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{item.purpose}</p>
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                Snapshot: {new Date(`${item.snapshotDate}T12:00:00Z`).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mt-5">
              <div>
                <p className="text-xs font-bold tracking-wider text-slate-500">AUTORIDADE</p>
                <p className="text-sm text-slate-700 mt-2">{item.authority}</p>
                <p className="text-xs font-bold tracking-wider text-slate-500 mt-4">EVIDÊNCIA DE DESCOBERTA</p>
                <p className="text-sm text-slate-600 mt-2">{item.discoveryEvidence}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Capability title="Disponível no OS" rows={item.supportedActions} empty="Nenhuma ação disponível" />
                <Capability title="Ainda não disponível" rows={item.unsupportedActions} empty="Nenhuma lacuna declarada" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-6 bg-slate-50">
        <p className="font-bold">Regra operacional</p>
        <p className="text-sm text-slate-600 mt-2">
          “Conectado” significa que a fonte foi identificada e é utilizável pela arquitetura atual para as ações declaradas.
          Não significa que todos os workflows estejam implementados, nem que o serviço esteja saudável neste exato momento.
          Saúde depende de checks recentes no módulo Saúde do Sistema.
        </p>
      </Card>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold tracking-wider text-slate-500">{label.toUpperCase()}</p>
      <p className="text-3xl font-black mt-2">{value}</p>
    </Card>
  )
}

function Capability({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-bold tracking-wider text-slate-500">{title.toUpperCase()}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 mt-3">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row} className="text-sm text-slate-700">
              {row}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
