import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ArrowDownCircle } from 'lucide-react'

export const metadata = {
  title: 'Cuentas por Cobrar | KINEXIS',
  description: 'Gestión de cobranza y facturas pendientes',
}

export default async function ReceivablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por Cobrar (CxC)"
        description="Gestión de cobranza y facturas pendientes"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <ArrowDownCircle className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">CxC en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Seguimiento de facturas por cobrar, cobranza automática y aging report disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
