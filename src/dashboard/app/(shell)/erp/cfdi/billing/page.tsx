import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { FilePlus } from 'lucide-react'

export const metadata = {
  title: 'Generar CFDI | KINEXIS',
  description: 'Generación de facturas CFDI 4.0 con timbrado SAT',
}

export default async function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Generar CFDI"
        description="Generación de facturas CFDI 4.0 con timbrado SAT"
        badge="#13"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <FilePlus className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #13 — CFDI Billing</h3>
          <p className="text-sm text-white/40 max-w-md">
            Generación y timbrado automático de CFDI 4.0 vía FacturAPI disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
