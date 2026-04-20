import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { PackageCheck } from 'lucide-react'

export const metadata = {
  title: 'Recepción de Mercancía | KINEXIS',
  description: 'Registro de entradas de proveedor',
}

export default async function ReceivingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recepción de Mercancía"
        description="Registro de entradas de proveedor"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <PackageCheck className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Recepción de Mercancía en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Registro de entradas contra orden de compra con verificación de cantidad y calidad disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
