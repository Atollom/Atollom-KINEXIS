import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Libro Diario | KINEXIS',
  description: 'Registro cronológico de transacciones',
}

export default async function JournalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro Diario"
        description="Registro cronológico de transacciones"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Libro Diario en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Registro de pólizas y asientos contables con importación automática disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
