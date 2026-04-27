import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Truck } from 'lucide-react'

export const metadata = {
  title: 'Envíos | KINEXIS',
  description: 'Coordinación logística y seguimiento de envíos',
}

export default async function ShippingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Envíos"
        description="Coordinación logística y seguimiento de envíos"
        badge="#29"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #29 — Coordinador de Envíos</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de guías, tracking en tiempo real y coordinación con paqueterías (Skydropx) disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
