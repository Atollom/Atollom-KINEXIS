'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface NpsResponse {
  id: string
  score: number
  comment: string | null
  created_at: string
  category: string | null
}

interface NpsData {
  responses: NpsResponse[]
  nps_score: number
  promoters: number
  passives: number
  detractors: number
  total: number
}

function classifyScore(score: number) {
  if (score >= 9) return { label: 'Promotor', color: 'text-green-600', bg: 'bg-green-50' }
  if (score >= 7) return { label: 'Pasivo', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  return { label: 'Detractor', color: 'text-red-500', bg: 'bg-red-50' }
}

export default function NpsPage() {
  const [data, setData] = useState<NpsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/crm/nps')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ responses: [], nps_score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Net Promoter Score</h1>
        <p className="text-sm text-gray-500 mt-1">Agente #19 · NPS Collector — satisfacción del cliente</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          {/* NPS Score + breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-5 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 mb-1 font-medium">NPS Score</p>
              <p className={`text-5xl font-black ${data.nps_score >= 30 ? 'text-green-600' : data.nps_score >= 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                {data.nps_score}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {data.nps_score >= 50 ? 'Excelente' : data.nps_score >= 30 ? 'Bueno' : data.nps_score >= 0 ? 'Regular' : 'Crítico'}
              </p>
            </div>
            {[
              { label: 'Promotores', count: data.promoters, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', range: '9-10' },
              { label: 'Pasivos', count: data.passives, icon: Minus, color: 'text-yellow-600', bg: 'bg-yellow-50', range: '7-8' },
              { label: 'Detractores', count: data.detractors, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', range: '0-6' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className={`inline-flex p-1.5 rounded-lg ${item.bg} mb-2`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                  <p className="text-xs text-gray-400">Puntuación {item.range}</p>
                </div>
              )
            })}
          </div>

          {/* Score bar */}
          {data.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Distribución de respuestas</h2>
              <div className="flex h-4 rounded-full overflow-hidden gap-px">
                {data.promoters > 0 && (
                  <div className="bg-green-500" style={{ flex: data.promoters }} title={`Promotores: ${data.promoters}`} />
                )}
                {data.passives > 0 && (
                  <div className="bg-yellow-400" style={{ flex: data.passives }} title={`Pasivos: ${data.passives}`} />
                )}
                {data.detractors > 0 && (
                  <div className="bg-red-400" style={{ flex: data.detractors }} title={`Detractores: ${data.detractors}`} />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">{data.total} respuestas totales</p>
            </div>
          )}

          {/* Responses list */}
          {data.responses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Respuestas recientes</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {data.responses.slice(0, 20).map(r => {
                  const cls = classifyScore(r.score)
                  return (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${i < r.score ? 'bg-green-400' : 'bg-gray-100'}`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{r.score}/10</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.bg} ${cls.color}`}>
                            {cls.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-600 italic">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {data.responses.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 py-20 flex flex-col items-center justify-center text-center">
              <Star className="w-12 h-12 text-gray-200 mb-4" />
              <p className="font-medium text-gray-500">Sin respuestas NPS todavía</p>
              <p className="text-sm text-gray-400 mt-1">Las encuestas se enviarán automáticamente post-compra</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
