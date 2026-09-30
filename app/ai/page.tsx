import { Card } from '@/components/ui/Card'

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-screen-xl mx-auto">
      <p className="text-xs font-bold tracking-[0.18em] text-slate-500">COMANDOS EM LINGUAGEM NATURAL</p>
      <h1 className="text-3xl font-black text-slate-950 mt-1">AI Command Center</h1>
      <p className="text-slate-500 mt-2 mb-8">A IA usará somente ferramentas autorizadas e nunca declarará uma ação concluída sem confirmação da fonte responsável.</p>
      <Card className="p-8">
        <p className="font-bold">Estrutura pronta</p>
        <p className="text-sm text-slate-500 mt-2">Este módulo está no XRANKFLOW OS, mas nenhuma integração será simulada. Funcionalidades serão habilitadas somente quando a fonte real estiver conectada e verificada.</p>
        <div className="mt-5 inline-flex px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Fonte ainda não conectada</div>
      </Card>
    </div>
  )
}
