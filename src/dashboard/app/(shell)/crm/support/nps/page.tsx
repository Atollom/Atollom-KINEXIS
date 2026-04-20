import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Star } from 'lucide-react'

export const metadata = {
  title: 'NPS (Net Promoter Score) | KINEXIS',
  description: 'Medición de satisfacción del cliente',
}

export default async function NPSPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="NPS (Net Promoter Score)"
        description="Medición de satisfacción del cliente"
        badge="#19"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Star className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #19 — NPS Automático</h3>
          <p className="text-sm text-white/40 max-w-md">
            Envío automático de encuestas NPS post-compra y análisis de satisfacción disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
