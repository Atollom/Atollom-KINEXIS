import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Box } from 'lucide-react'

export const metadata = {
  title: 'Catálogo de Productos | KINEXIS',
  description: 'Maestro de productos y SKUs',
}

export default async function InventoryProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Productos"
        description="Maestro de productos y SKUs"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Box className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Catálogo de Productos en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Maestro de SKUs con atributos, códigos de barras y sincronización multicanal disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
