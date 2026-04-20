import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ArrowUpCircle } from 'lucide-react'

export const metadata = {
  title: 'Cuentas por Pagar | KINEXIS',
  description: 'Gestión de pagos a proveedores',
}

export default async function PayablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por Pagar (CxP)"
        description="Gestión de pagos a proveedores"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <ArrowUpCircle className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">CxP en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de pagos a proveedores con calendario de vencimientos disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
