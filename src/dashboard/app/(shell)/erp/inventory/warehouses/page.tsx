import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Warehouse } from 'lucide-react'

export const metadata = {
  title: 'Almacenes | KINEXIS',
  description: 'Gestión de múltiples almacenes y ubicaciones',
}

export default async function WarehousesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Almacenes"
        description="Gestión de múltiples almacenes y ubicaciones"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Warehouse className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Almacenes en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de múltiples almacenes, ubicaciones y zonas de picking disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
