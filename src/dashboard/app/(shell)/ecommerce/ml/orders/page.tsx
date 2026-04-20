import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ShoppingBag } from 'lucide-react'

export const metadata = {
  title: 'Órdenes Mercado Libre | KINEXIS',
  description: 'Gestión de órdenes de venta en Mercado Libre',
}

export default async function MLOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes Mercado Libre"
        description="Gestión de órdenes de venta en Mercado Libre"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Órdenes ML en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de órdenes Mercado Libre disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
