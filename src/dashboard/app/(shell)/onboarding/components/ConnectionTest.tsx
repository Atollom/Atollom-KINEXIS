'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, XCircle, Zap } from 'lucide-react'

interface ConnectionTestProps {
  provider: string
  testFn: () => Promise<{ success: boolean; message: string }>
  disabled?: boolean
}

export function ConnectionTest({ provider, testFn, disabled = false }: ConnectionTestProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    try {
      const res = await testFn()
      setResult(res)
    } catch (err) {
      setResult({ success: false, message: `Error al conectar con ${provider}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleTest}
        disabled={testing || disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest
          transition-all duration-200
          ${disabled
            ? 'bg-white/5 text-white/20 cursor-not-allowed'
            : 'bg-white/10 text-white/70 hover:bg-[#CCFF00]/10 hover:text-[#CCFF00] hover:border-[#CCFF00]/30 border border-white/10'
          }
        `}
      >
        {testing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Zap className="w-3 h-3" />
        )}
        {testing ? 'Probando...' : 'Probar Conexión'}
      </button>

      {result && (
        <div
          className={`flex items-start gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
            result.success
              ? 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          {result.message}
        </div>
      )}
    </div>
  )
}
