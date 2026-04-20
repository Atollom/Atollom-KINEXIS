import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Gestión de Precios | KINEXIS',
  description: 'Actualización de precios en 3 canales simultáneos',
}

export default async function PricingManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Precios"
        description="Actualización de precios en 3 canales simultáneos"
        badge="#6"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #6 — Pricing Omnicanal</h3>
          <p className="text-sm text-white/40 max-w-md">
            Actualización simultánea de precios en ML, Amazon y Shopify con reglas automáticas disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
