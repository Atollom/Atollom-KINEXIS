import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Warehouse } from 'lucide-react'

export const metadata = {
  title: 'Amazon FBA Manager | KINEXIS',
  description: 'Gestión de inventario Fulfillment by Amazon',
}

export default async function AmazonFBAPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Amazon FBA Manager"
        description="Gestión de inventario Fulfillment by Amazon"
        badge="#2"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Warehouse className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #2 — Amazon FBA</h3>
          <p className="text-sm text-white/40 max-w-md">
            Monitoreo de inventario FBA, reposición automática y alertas de stock disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
