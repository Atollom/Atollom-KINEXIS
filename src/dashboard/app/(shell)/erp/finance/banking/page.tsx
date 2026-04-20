import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Landmark } from 'lucide-react'

export const metadata = {
  title: 'Conciliación Bancaria | KINEXIS',
  description: 'Conciliación automática de movimientos bancarios',
}

export default async function BankingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conciliación Bancaria"
        description="Conciliación automática de movimientos bancarios"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Landmark className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Conciliación Bancaria en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Importación de estados de cuenta y conciliación automática disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
