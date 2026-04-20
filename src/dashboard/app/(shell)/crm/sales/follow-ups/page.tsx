import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Clock } from 'lucide-react'

export const metadata = {
  title: 'Seguimiento | KINEXIS',
  description: 'Follow-ups automáticos a leads inactivos',
}

export default async function FollowUpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Seguimiento"
        description="Follow-ups automáticos a leads inactivos"
        badge="#33"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #33 — Follow-up Automático</h3>
          <p className="text-sm text-white/40 max-w-md">
            Secuencias de seguimiento automático por WhatsApp y correo para leads inactivos disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
