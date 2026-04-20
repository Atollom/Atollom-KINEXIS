import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Receipt } from 'lucide-react'

export const metadata = {
  title: 'Facturas Emitidas | KINEXIS',
  description: 'Historial de facturas generadas',
}

export default async function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas Emitidas"
        description="Historial de facturas generadas"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Receipt className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Facturas Emitidas en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Historial completo de CFDI emitidos con descarga de XML y PDF disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
