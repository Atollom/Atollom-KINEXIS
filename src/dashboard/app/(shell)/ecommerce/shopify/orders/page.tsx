import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ShoppingCart } from 'lucide-react'

export const metadata = {
  title: 'Órdenes Shopify | KINEXIS',
  description: 'Gestión de pedidos de tienda en línea',
}

export default async function ShopifyOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes Shopify"
        description="Gestión de pedidos de tienda en línea"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Órdenes Shopify en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión unificada de pedidos de tienda en línea disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
