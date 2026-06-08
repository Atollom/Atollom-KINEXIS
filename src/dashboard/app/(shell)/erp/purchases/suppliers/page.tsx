'use client'

import { useEffect, useState } from 'react'
import { Star, Phone, Mail, ShoppingCart, Award } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  categories: string[]
  active: boolean
  score_total: number
  score_precio: number
  score_calidad: number
  score_tiempo: number
  incumplimientos: number
  total_purchased: number
  grade: 'A' | 'B' | 'C' | 'D'
  last_evaluation: string | null
}

interface Stats {
  total: number
  active: number
  grade_a: number
  avg_score: number
  total_purchased: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const gradeConfig = {
  A: { color: 'text-green-700', bg: 'bg-green-100' },
  B: { color: 'text-blue-700', bg: 'bg-blue-100' },
  C: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  D: { color: 'text-red-700', bg: 'bg-red-100' },
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/erp/purchases/suppliers')
      .then(r => r.json())
      .then(d => {
        setSuppliers(d.suppliers ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores Aprobados</h1>
          <p className="text-sm text-gray-500 mt-1">Evaluación y desempeño de proveedores</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #16 · ERP</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, suffix: '' },
            { label: 'Activos', value: stats.active, suffix: '' },
            { label: 'Grado A', value: stats.grade_a, suffix: '' },
            { label: 'Score promedio', value: stats.avg_score, suffix: '/100' },
            { label: 'Compras totales', value: null, currency: stats.total_purchased },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">
                {card.currency !== undefined ? fmt(card.currency) : `${card.value}${card.suffix}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-44 border border-gray-100" />
        )) : suppliers.map(s => {
          const gc = gradeConfig[s.grade]
          const isSelected = selected === s.id
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${gc.bg} ${gc.color}`}>{s.grade}</span>
                    </div>
                    {s.categories.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {s.categories.slice(0, 3).map(c => (
                          <span key={c} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-lg font-bold text-gray-900">{s.score_total}</p>
                    <p className="text-xs text-gray-400">score</p>
                  </div>
                </div>

                <div className="flex gap-4 text-sm mb-3">
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-gray-400 hover:text-green-600 transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-xs truncate max-w-[120px]">{s.email}</span>
                    </a>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">{s.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {fmt(s.total_purchased)}
                  </div>
                  {s.incumplimientos > 0 && (
                    <span className="text-red-500 font-medium">{s.incumplimientos} incumpl.</span>
                  )}
                </div>

                <button onClick={() => setSelected(isSelected ? null : s.id)} className="mt-3 text-xs text-green-600 hover:text-green-800 font-medium">
                  {isSelected ? 'Ocultar evaluación' : 'Ver evaluación'}
                </button>
              </div>

              {isSelected && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-2">
                  <ScoreBar value={s.score_precio} label="Precio" />
                  <ScoreBar value={s.score_calidad} label="Calidad" />
                  <ScoreBar value={s.score_tiempo} label="Tiempo de entrega" />
                  {s.last_evaluation && (
                    <p className="text-xs text-gray-400 pt-1">Última evaluación: {new Date(s.last_evaluation).toLocaleDateString('es-MX')}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {!loading && suppliers.length === 0 && (
          <div className="col-span-full bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin proveedores registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
