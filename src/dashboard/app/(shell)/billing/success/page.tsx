'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const plan = params.get('plan') ?? 'Growth'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido a KINEXIS {plan}!</h1>
      <p className="text-gray-500 mb-8 max-w-md">Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funciones de tu plan.</p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
          Ir al dashboard
        </Link>
        <Link href="/settings/integrations" className="px-6 py-3 border-2 border-gray-200 hover:border-green-500 text-gray-700 font-semibold rounded-xl transition-colors">
          Configurar integraciones
        </Link>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
