'use client'

import dynamic from 'next/dynamic'

const SamanthaFixedPanel = dynamic(
  () => import('./SamanthaFixedPanel').then(m => ({ default: m.SamanthaFixedPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full items-center justify-center gap-3 opacity-30">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-[10px] font-black label-tracking text-on-surface/40">SAMANTHA</span>
      </div>
    ),
  }
)

export function DynamicSamanthaPanel() {
  return <SamanthaFixedPanel />
}
