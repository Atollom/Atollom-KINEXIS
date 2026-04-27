import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { RotateCcw } from 'lucide-react'

export const metadata = {
  title: 'Devoluciones | KINEXIS',
  description: 'Gestión y procesamiento de devoluciones y reembolsos',
}

export default async function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Devoluciones"
        description="Gestión y procesamiento de devoluciones y reembolsos"
        badge="#22"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #22 — Devoluciones y Reembolsos</h3>
          <p className="text-sm text-white/40 max-w-md">
            Procesamiento automático de devoluciones, reembolsos y disputas en todos los canales disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
