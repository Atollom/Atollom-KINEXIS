'use client'

import { useEffect, useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react'

interface ComplianceCheck {
  id: string
  label: string
  description: string
  status: 'ok' | 'warning' | 'error'
  detail: string | null
}

interface ComplianceData {
  checks: ComplianceCheck[]
  score: number
  last_verified: string
  stats: {
    ok: number
    warning: number
    error: number
  }
}

function StatusIcon({ status }: { status: 'ok' | 'warning' | 'error' }) {
  if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-500" />
  if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  return <XCircle className="w-5 h-5 text-red-500" />
}

export default function CFDICompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/cfdi/compliance')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const score = data?.score ?? 0
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const scoreRingColor = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#ef4444'
  const circumference = 2 * Math.PI * 48
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cumplimiento SAT</h1>
          <p className="text-sm text-gray-500 mt-1">Verificación de requisitos fiscales CFDI 4.0</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #13 · ERP</span>
      </div>

      {/* Score card */}
      {loading ? (
        <div className="bg-white rounded-xl p-6 animate-pulse h-40 border border-gray-100" />
      ) : data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-8">
            {/* Score ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width="120" height="120" className="-rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="60" cy="60" r="48" fill="none"
                  stroke={scoreRingColor} strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
                <p className="text-xs text-gray-400">/ 100</p>
              </div>
            </div>

            <div className="flex-1">
              <h2 className={`text-xl font-bold mb-1 ${scoreColor}`}>
                {score >= 80 ? 'Cumplimiento excelente' : score >= 60 ? 'Cumplimiento parcial' : 'Requiere atención'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Última verificación: {data.last_verified ? new Date(data.last_verified).toLocaleString('es-MX') : 'N/A'}
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">{data.stats.ok} correctos</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{data.stats.warning} advertencias</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">{data.stats.error} errores</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checks list */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-20 border border-gray-100" />
        )) : (data?.checks ?? []).map(check => (
          <div key={check.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${check.status === 'error' ? 'border-red-100' : check.status === 'warning' ? 'border-yellow-100' : 'border-gray-100'}`}>
            <div className="p-5 flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                <StatusIcon status={check.status} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{check.label}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    check.status === 'ok' ? 'bg-green-100 text-green-700' :
                    check.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {check.status === 'ok' ? 'OK' : check.status === 'warning' ? 'Advertencia' : 'Error'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{check.description}</p>
                {check.detail && (
                  <p className={`text-xs mt-1.5 font-medium ${check.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                    → {check.detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && (!data || data.checks.length === 0) && (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin verificaciones de cumplimiento disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
