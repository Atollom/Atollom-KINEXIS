import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { MapPin } from 'lucide-react'

export const metadata = {
  title: 'Rastreo de Envíos | KINEXIS',
  description: 'Seguimiento de paquetes en tiempo real',
}

export default async function TrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rastreo de Envíos"
        description="Seguimiento de paquetes en tiempo real"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Rastreo en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Seguimiento en tiempo real con notificaciones automáticas al cliente disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
