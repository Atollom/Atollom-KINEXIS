import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Truck } from 'lucide-react'

export const metadata = {
  title: 'Envíos | KINEXIS',
  description: 'Generación de guías Skydropx',
}

export default async function ShippingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Envíos"
        description="Generación de guías Skydropx"
        badge="#25"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #25 — Shipping</h3>
          <p className="text-sm text-white/40 max-w-md">
            Generación automática de guías vía Skydropx (Estafeta, DHL, FedEx) disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
