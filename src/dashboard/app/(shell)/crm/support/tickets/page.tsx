import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Headphones } from 'lucide-react'

export const metadata = {
  title: 'Tickets de Soporte | KINEXIS',
  description: 'Atención y clasificación de tickets',
}

export default async function TicketsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets de Soporte"
        description="Atención y clasificación de tickets"
        badge="#37"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Headphones className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #37 — Soporte Automático</h3>
          <p className="text-sm text-white/40 max-w-md">
            Clasificación y resolución automática de tickets de soporte con IA disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
