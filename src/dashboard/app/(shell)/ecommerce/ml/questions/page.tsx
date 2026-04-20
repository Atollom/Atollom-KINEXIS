import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Preguntas ML | KINEXIS',
  description: 'Respuestas automáticas a preguntas de compradores',
}

export default async function MLQuestionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Preguntas ML"
        description="Respuestas automáticas a preguntas de compradores"
        badge="#27"
      />

      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Agente #27 — ML Q&A</h3>
          <p className="text-sm text-white/40 max-w-md">
            Respuestas automáticas con IA a preguntas de compradores en ML disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
