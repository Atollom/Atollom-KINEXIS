import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { List } from 'lucide-react'

export const metadata = {
  title: 'Catálogo de Cuentas | KINEXIS',
  description: 'Plan contable y clasificación de cuentas',
}

export default async function ChartOfAccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Cuentas"
        description="Plan contable y clasificación de cuentas"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <List className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Catálogo de Cuentas en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Plan de cuentas contable con clasificación SAT y cuentas personalizadas disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
