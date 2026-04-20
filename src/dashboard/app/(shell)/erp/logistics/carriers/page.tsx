import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Plane } from 'lucide-react'

export const metadata = {
  title: 'Paqueterías | KINEXIS',
  description: 'Gestión de transportistas (Estafeta, DHL, FedEx)',
}

export default async function CarriersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Paqueterías"
        description="Gestión de transportistas (Estafeta, DHL, FedEx)"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Plane className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Paqueterías en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Comparador de tarifas y gestión de cuentas con Estafeta, DHL y FedEx disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
