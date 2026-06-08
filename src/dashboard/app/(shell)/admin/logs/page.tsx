'use client'

import { useState, useEffect } from 'react'
import { Activity, Filter, RefreshCw } from 'lucide-react'

interface AuditLog {
  id: string
  user_id: string
  action: string
  module: string
  resource_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const MODULE_COLORS: Record<string, string> = {
  crm: 'bg-blue-100 text-blue-700',
  erp: 'bg-purple-100 text-purple-700',
  ecommerce: 'bg-orange-100 text-orange-700',
  auth: 'bg-gray-100 text-gray-700',
  billing: 'bg-green-100 text-green-700',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [modules, setModules] = useState<string[]>([])
  const [module, setModule] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  async function load(mod: string) {
    setLoading(true)
    try {
      const url = mod === 'all' ? '/api/admin/logs' : `/api/admin/logs?module=${mod}`
      const res = await fetch(url)
      const data = await res.json()
      setLogs(data.logs ?? [])
      if (data.modules?.length) setModules(data.modules)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('all') }, [])

  function handleModuleChange(mod: string) {
    setModule(mod)
    load(mod)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoría</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de acciones del sistema</p>
        </div>
        <button
          onClick={() => load(module)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-green-400 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Module filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {['all', ...modules].map(mod => (
          <button
            key={mod}
            onClick={() => handleModuleChange(mod)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${module === mod ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
          >
            {mod === 'all' ? 'Todos' : mod}
          </button>
        ))}
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="w-12 h-12 text-gray-200 mb-4" />
            <p className="font-medium text-gray-500">Sin registros de auditoría</p>
            <p className="text-sm text-gray-400 mt-1">Las acciones del sistema aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Fecha</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Módulo</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Acción</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Recurso</th>
                  <th className="text-left font-semibold text-gray-500 px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MODULE_COLORS[log.module] ?? 'bg-gray-100 text-gray-700'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.resource_id ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]">
                      {log.user_id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">Mostrando últimos {logs.length} registros</p>
    </div>
  )
}
