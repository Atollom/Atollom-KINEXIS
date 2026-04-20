import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Ventas Cerradas | KINEXIS',
  description: 'Historial de deals ganados',
}

export default async function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas Cerradas"
        description="Historial de deals ganados"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Deals Cerrados en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Historial de ventas cerradas con métricas de ciclo de venta y valor disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
