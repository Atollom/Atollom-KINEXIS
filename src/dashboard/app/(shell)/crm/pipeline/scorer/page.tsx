import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Target } from 'lucide-react'

export const metadata = {
  title: 'Lead Scorer | KINEXIS',
  description: 'Puntuación automática de leads con ML',
}

export default async function LeadScorerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Scorer"
        description="Puntuación automática de leads con ML"
        badge="#31"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #31 — Lead Scorer</h3>
          <p className="text-sm text-white/40 max-w-md">
            Puntuación automática de leads basada en comportamiento, canal e historial de compra disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
