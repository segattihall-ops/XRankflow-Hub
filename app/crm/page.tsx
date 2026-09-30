import { Card } from '@/components/ui/Card'

export default function CRMPage(){
 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">REVENUE OPERATIONS</p>
  <h1 className="text-3xl font-black mt-1">CRM Central</h1>
  <p className="text-slate-500 mt-2 mb-8">Visão consolidada de leads, clientes, providers, parceiros e oportunidades — sem duplicar CRMs especializados.</p>
  <Card className="p-8">
    <p className="font-bold">Fonte ainda não conectada</p>
    <p className="text-sm text-slate-500 mt-2">O XRANKFLOW OS não exibirá “0 leads” ou “$0 pipeline” como se fossem fatos. O CRM consolidado será habilitado após a definição e conexão das fontes autoritativas por empresa.</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
      {['Contatos','Leads','Clientes','Pipeline'].map(x=><div key={x} className="rounded-xl bg-slate-50 border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">{x.toUpperCase()}</p><p className="text-lg font-bold mt-2 text-slate-400">Não conectado</p></div>)}
    </div>
  </Card>
 </div>
}
