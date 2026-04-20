import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { PieChart } from 'lucide-react'

export const metadata = {
  title: 'Analytics Shopify | KINEXIS',
  description: 'Métricas de ventas en tienda',
}

export default async function ShopifyAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Shopify"
        description="Métricas de ventas en tienda"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <PieChart className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Analytics Shopify en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Métricas de conversión, AOV y rendimiento de tienda disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
