import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { LineChart } from 'lucide-react'

export const metadata = {
  title: 'Flujo de Efectivo | KINEXIS',
  description: 'Proyección y análisis de cash flow',
}

export default async function CashflowPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Flujo de Efectivo"
        description="Proyección y análisis de cash flow"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <LineChart className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Flujo de Efectivo en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Proyección de cash flow a 30/60/90 días con alertas de liquidez disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
