'use client'

import { useEffect, useState } from 'react'
import { Headphones, CheckCircle, AlertTriangle, Clock, MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  channel: string
  customer_name: string
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  open: number
  escalated: number
  resolved: number
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Hace menos de 1h'
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}

const priorityConfig: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
}

const priorityLabel: Record<string, string> = {
  critical: 'Crítico', high: 'Alto', medium: 'Medio', low: 'Bajo',
}

const channelConfig: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  web: 'bg-gray-100 text-gray-600',
  email: 'bg-yellow-100 text-yellow-700',
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'escalated'>('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/crm/tickets')
      .then(r => r.json())
      .then(d => {
        setTickets(d.tickets ?? [])
        setStats(d.stats ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function patchStatus(ticketId: string, status: string) {
    setProcessing(ticketId)
    try {
      const res = await fetch('/api/crm/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, status }),
      })
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))
        setStats(prev => prev ? {
          ...prev,
          open: prev.open + (status === 'open' ? 1 : (tickets.find(t => t.id === ticketId)?.status === 'open' ? -1 : 0)),
          escalated: prev.escalated + (status === 'escalated' ? 1 : (tickets.find(t => t.id === ticketId)?.status === 'escalated' ? -1 : 0)),
          resolved: prev.resolved + (status === 'resolved' ? 1 : 0),
        } : prev)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(null)
    }
  }

  const filtered = filter === 'all' ? tickets.filter(t => t.status !== 'resolved')
    : filter === 'open' ? tickets.filter(t => t.status === 'open')
    : tickets.filter(t => t.status === 'escalated')

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de Soporte</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de casos e incidencias de clientes</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Agente #37 · CRM</span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-20 border border-gray-100" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Abiertos</span></div>
            <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Escalados</span></div>
            <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-xs text-gray-500">Resueltos</span></div>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'open', 'escalated'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? (f === 'escalated' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Activos' : f === 'open' ? 'Abiertos' : 'Escalados'}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-28 border border-gray-100" />
        )) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin tickets en esta categoría</p>
          </div>
        ) : filtered.map(ticket => (
          <div key={ticket.id} className={`bg-white rounded-xl shadow-sm border transition-all ${ticket.status === 'escalated' ? 'border-red-100' : 'border-gray-100'}`}>
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[ticket.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                    {priorityLabel[ticket.priority] ?? ticket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${channelConfig[ticket.channel] ?? 'bg-gray-100 text-gray-500'}`}>
                    {ticket.channel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {ticket.customer_name}
                  </div>
                  <span>{relativeTime(ticket.created_at)}</span>
                </div>
              </div>

              {ticket.status !== 'resolved' && (
                <div className="flex gap-2 shrink-0">
                  {ticket.status === 'open' && (
                    <button
                      onClick={() => patchStatus(ticket.id, 'escalated')}
                      disabled={processing === ticket.id}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Escalar
                    </button>
                  )}
                  <button
                    onClick={() => patchStatus(ticket.id, 'resolved')}
                    disabled={processing === ticket.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processing === ticket.id ? '...' : 'Resolver'}
                  </button>
                </div>
              )}

              {ticket.status === 'resolved' && (
                <span className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                  <CheckCircle className="w-4 h-4" />Resuelto
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
