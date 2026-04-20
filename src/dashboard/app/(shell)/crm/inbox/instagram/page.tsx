import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { Instagram } from 'lucide-react'

export const metadata = {
  title: 'Instagram Direct | KINEXIS',
  description: 'Mensajes directos de Instagram',
}

export default async function InstagramPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Direct"
        description="Mensajes directos de Instagram"
      />
      <Suspense fallback={<PageSkeleton />}>
        <div className="glassmorphism p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
            <Instagram className="w-8 h-8 text-[#CCFF00]/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/80">Instagram Direct en desarrollo</h3>
          <p className="text-sm text-white/40 max-w-md">
            Gestión de DMs y comentarios de Instagram Graph API disponible en Fase 2.
          </p>
        </div>
      </Suspense>
    </div>
  )
}
