'use client'

import { Zap, MessageSquare, Star, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const automations = [
  {
    id: 'hot_lead_alert',
    title: 'Alerta Lead Caliente',
    description: 'Notifica a Samantha cuando un lead alcanza score ≥ 70 para contacto inmediato',
    trigger: 'Score ≥ 70',
    action: 'Notificación + Samantha proactiva',
    status: 'active',
    icon: Star,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    id: 'stale_lead',
    title: 'Lead Sin Actividad',
    description: 'Marca leads como "en riesgo" cuando pasan 14 días sin actualización',
    trigger: '14 días sin actividad',
    action: 'Marcar at_risk = true',
    status: 'active',
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 'new_ticket_notify',
    title: 'Nuevo Ticket de Soporte',
    description: 'Avisa al equipo cuando llega un ticket de prioridad alta o crítica',
    trigger: 'Ticket priority: high/critical',
    action: 'Notificación interna',
    status: 'active',
    icon: MessageSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'quote_followup',
    title: 'Seguimiento de Cotización',
    description: 'Recordatorio automático 3 días después de enviar cotización sin respuesta',
    trigger: '3 días post quote_sent',
    action: 'Tarea de seguimiento + alerta',
    status: 'pending',
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
]

export default function AutomationPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automatización CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Flujos automáticos controlados por Samantha</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">CRM · Agentes</span>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
        <Zap className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Samantha gestiona la automatización</p>
          <p className="text-xs mt-1 text-blue-600">Los flujos se ejecutan via el Guardian Agent (#0) que despacha agentes especializados según reglas del pipeline. La configuración avanzada de triggers se hará desde el panel de agentes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map(auto => {
          const Icon = auto.icon
          return (
            <div key={auto.id} className={`bg-white rounded-xl shadow-sm border p-5 ${auto.status === 'pending' ? 'border-gray-100 opacity-70' : 'border-gray-100'}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${auto.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${auto.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{auto.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${auto.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {auto.status === 'active' ? 'Activo' : 'Próximamente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{auto.description}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex gap-2"><span className="text-gray-400 w-16 shrink-0">Trigger:</span><span className="text-gray-700 font-medium">{auto.trigger}</span></div>
                <div className="flex gap-2"><span className="text-gray-400 w-16 shrink-0">Acción:</span><span className="text-gray-700">{auto.action}</span></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Módulos relacionados</h2>
        <div className="space-y-2">
          {[
            { label: 'Lead Scorer — Priorización automática', href: '/crm/pipeline/scorer' },
            { label: 'Pipeline Kanban — Vista de etapas', href: '/crm/pipeline' },
            { label: 'Oportunidades — Pipeline ponderado', href: '/crm/sales/opportunities' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm text-gray-700 group-hover:text-green-700">{link.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
