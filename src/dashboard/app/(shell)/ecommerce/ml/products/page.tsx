import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Package } from 'lucide-react'

export const metadata = {
  title: 'Productos Mercado Libre | KINEXIS',
  description: 'Catálogo completo de productos publicados en ML',
}

export default async function MLProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos Mercado Libre"
        description="Catálogo completo de productos publicados en ML"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Catálogo ML en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Sincronización de productos con Mercado Libre API disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
