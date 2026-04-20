import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ArrowLeftRight } from 'lucide-react'

export const metadata = {
  title: 'Movimientos de Inventario | KINEXIS',
  description: 'Entradas, salidas y transferencias',
}

export default async function MovementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos de Inventario"
        description="Entradas, salidas y transferencias"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <ArrowLeftRight className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Movimientos en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Registro de entradas, salidas, ajustes y transferencias entre almacenes disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
