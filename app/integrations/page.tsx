import { Card } from '@/components/ui/Card'

const integrations = [
  {name:'GitHub', role:'Código e histórico de engenharia', state:'Conectado', source:'XRankflow-Hub e repositórios do portfólio'},
  {name:'Vercel', role:'Deployments e produção', state:'Conectado', source:'x-rankflow-hub e projetos do portfólio'},
  {name:'Supabase — XRANKFLOW Hub', role:'Auth + dados operacionais', state:'Conectado', source:'wh_* e registros XRMG'},
  {name:'Supabase — MasseurMatch', role:'Dados do produto', state:'Parcial', source:'Projeto identificado; mapeamento de entidades pendente'},
  {name:'Supabase — PIROKA', role:'Dados do produto', state:'Parcial', source:'Projeto identificado; mapeamento de entidades pendente'},
  {name:'Email', role:'Universal Inbox', state:'Pendente', source:'Fonte ainda não conectada no OS'},
  {name:'Calendário', role:'Agenda operacional', state:'Pendente', source:'Fonte ainda não conectada no OS'},
  {name:'Documentos oficiais', role:'Knowledge OS', state:'Pendente', source:'Autoridade atual ainda precisa ser verificada'},
  {name:'Contabilidade / Banking', role:'Finance OS', state:'Pendente', source:'Autoridade ainda não verificada'},
]
const tone:Record<string,string>={Conectado:'bg-emerald-50 text-emerald-700',Parcial:'bg-amber-50 text-amber-700',Pendente:'bg-slate-100 text-slate-600'}

export default function Page(){
 return <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">SETTINGS</p>
  <h1 className="text-3xl font-black mt-1">Integrações & Fontes de Verdade</h1>
  <p className="text-slate-500 mt-2 mb-8">Registro explícito do que está conectado, parcial ou ainda não conectado.</p>
  <Card className="overflow-hidden">
   <div className="divide-y divide-slate-100">
    {integrations.map(i=><div key={i.name} className="p-5 grid md:grid-cols-[1fr_1.2fr_auto] gap-3 items-center">
      <div><p className="font-bold">{i.name}</p><p className="text-sm text-slate-500">{i.role}</p></div>
      <p className="text-sm text-slate-600">{i.source}</p>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${tone[i.state]}`}>{i.state}</span>
    </div>)}
   </div>
  </Card>
  <p className="text-xs text-slate-400 mt-4">Snapshot de descoberta: 30/09/2026. “Conectado” indica fonte identificada e acessível pela arquitetura atual; não significa que todos os workflows já estejam implementados.</p>
 </div>
}
