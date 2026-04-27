import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Base de Conocimiento | KINEXIS',
  description: 'Repositorio de respuestas y artículos de ayuda para soporte',
}

export default async function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de Conocimiento"
        description="Repositorio de respuestas y artículos de ayuda para soporte"
        badge="#38"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #38 — Base de Conocimiento</h3>
          <p className="text-sm text-white/40 max-w-md">
            Generación automática de artículos de ayuda y respuestas frecuentes con IA disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
