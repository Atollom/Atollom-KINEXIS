import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Users } from 'lucide-react'

export const metadata = {
  title: 'Proveedores | KINEXIS',
  description: 'Evaluación y gestión de proveedores',
}

export default async function SuppliersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Evaluación y gestión de proveedores"
        badge="#16"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #16 — Gestión de Proveedores</h3>
          <p className="text-sm text-white/40 max-w-md">
            Evaluación de proveedores por precio, calidad y tiempo de entrega disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
