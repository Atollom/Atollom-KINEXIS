import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Printer } from 'lucide-react'

export const metadata = {
  title: 'Impresión Fiscal | KINEXIS',
  description: 'Impresión de facturas y tickets fiscales',
}

export default async function PrintPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Impresión Fiscal"
        description="Impresión de facturas y tickets fiscales"
        badge="#24"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Printer className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #24 — Impresión Fiscal</h3>
          <p className="text-sm text-white/40 max-w-md">
            Impresión directa a impresora térmica de tickets y facturas disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
