import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Store } from 'lucide-react'

export const metadata = {
  title: 'Productos Shopify | KINEXIS',
  description: 'Catálogo de productos en tienda Shopify',
}

export default async function ShopifyProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos Shopify"
        description="Catálogo de productos en tienda Shopify"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Store className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Catálogo Shopify en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Sincronización con Shopify GraphQL Admin API disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
