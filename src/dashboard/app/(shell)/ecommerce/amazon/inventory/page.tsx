import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Box } from 'lucide-react'

export const metadata = {
  title: 'Inventario Amazon | KINEXIS',
  description: 'Control de stock en Amazon',
}

export default async function AmazonInventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario Amazon"
        description="Control de stock en Amazon"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Box className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Inventario Amazon en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Control de stock, movimientos y valorización en Amazon disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
