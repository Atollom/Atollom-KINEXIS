import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Boxes } from 'lucide-react'

export const metadata = {
  title: 'Inventario | KINEXIS',
  description: 'Control de stock y alertas de reposición multicanal',
}

export default async function ManagementInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Control de stock y alertas de reposición multicanal"
        badge="#7"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Boxes className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #7 — Control de Inventario</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión centralizada de stock en ML, Amazon y Shopify con alertas automáticas de reposición disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
