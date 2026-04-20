import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Facebook } from 'lucide-react'

export const metadata = {
  title: 'Facebook Messenger | KINEXIS',
  description: 'Conversaciones de Facebook Messenger',
}

export default async function FacebookPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facebook Messenger"
        description="Conversaciones de Facebook Messenger"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Facebook className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Facebook Messenger en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de conversaciones Messenger vía Facebook Graph API disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
