import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { UserPlus } from 'lucide-react'

export const metadata = {
  title: 'Leads | KINEXIS',
  description: 'Gestión de leads capturados',
}

export default async function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gestión de leads capturados"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Gestión de Leads en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Captura, calificación y seguimiento de leads desde todos los canales disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
