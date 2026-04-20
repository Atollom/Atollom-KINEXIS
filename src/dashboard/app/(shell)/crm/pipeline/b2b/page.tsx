import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Building2 } from 'lucide-react'

export const metadata = {
  title: 'B2B Collector | KINEXIS',
  description: 'Captación y calificación de leads B2B',
}

export default async function B2BCollectorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B Collector"
        description="Captación y calificación de leads B2B"
        badge="#4"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #4 — B2B Collector</h3>
          <p className="text-sm text-white/40 max-w-md">
            Identificación y calificación automática de leads empresariales B2B disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
