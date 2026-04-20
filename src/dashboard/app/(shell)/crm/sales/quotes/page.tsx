import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Cotizaciones | KINEXIS',
  description: 'Generación de cotizaciones profesionales',
}

export default async function QuotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cotizaciones"
        description="Generación de cotizaciones profesionales"
        badge="#32"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #32 — Generador de Cotizaciones</h3>
          <p className="text-sm text-white/40 max-w-md">
            Generación automática de cotizaciones PDF personalizadas para clientes B2B disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
