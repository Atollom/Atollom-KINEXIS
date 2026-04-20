import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Valorización de Inventario | KINEXIS',
  description: 'Valoración de stock (PEPS, Promedio, Último)',
}

export default async function ValuationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Valorización de Inventario"
        description="Valoración de stock (PEPS, Promedio, Último)"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Valorización en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Métodos PEPS, Promedio Ponderado y UEPS con reporte de costo de ventas disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
