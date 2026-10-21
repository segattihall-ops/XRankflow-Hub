'use client'

export function TopBanner() {
  return (
    <div className="bg-[#070707] text-neutral-200 px-4 py-2 border-b border-white/[0.08]">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold tracking-wide">XRANKFLOW OS</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-neutral-500">Verified execution only</span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
            AUTO
          </span>
        </div>
      </div>
    </div>
  )
}
