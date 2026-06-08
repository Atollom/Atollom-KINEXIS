'use client'

import { Megaphone, Mail, Bell, Users, Clock } from 'lucide-react'
import Link from 'next/link'

const CAMPAIGN_TYPES = [
  {
    name: 'Email Marketing',
    icon: Mail,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
    desc: 'Campañas automáticas por email post-compra, re-engagement y nurturing',
    status: 'pending',
  },
  {
    name: 'WhatsApp Masivo',
    icon: Bell,
    bg: 'bg-green-50',
    color: 'text-green-600',
    desc: 'Mensajes masivos a segmentos de clientes via WhatsApp Business API',
    status: 'pending_cert',
  },
  {
    name: 'Segmentación avanzada',
    icon: Users,
    bg: 'bg-purple-50',
    color: 'text-purple-600',
    desc: 'Agrupa clientes por comportamiento, valor y etapa del ciclo de vida',
    href: '/crm/segments',
    status: 'active',
  },
  {
    name: 'Automatizaciones CRM',
    icon: Clock,
    bg: 'bg-orange-50',
    color: 'text-orange-600',
    desc: 'Flujos automáticos de seguimiento, alertas y notificaciones',
    href: '/crm/automation',
    status: 'active',
  },
]

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
        <p className="text-sm text-gray-500 mt-1">Marketing automatizado y comunicación masiva</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
        <p className="font-semibold">Módulo en desarrollo</p>
        <p className="text-yellow-700 mt-0.5">Las campañas de email y WhatsApp masivo se activarán en la siguiente fase. Las herramientas de segmentación y automatización ya están disponibles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPAIGN_TYPES.map(campaign => {
          const Icon = campaign.icon
          const card = (
            <div className={`bg-white rounded-xl shadow-sm border p-5 ${campaign.status === 'active' ? 'border-gray-100 hover:border-green-200 hover:shadow-md transition-all cursor-pointer' : 'border-gray-100 opacity-70'}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${campaign.bg}`}>
                  <Icon className={`w-5 h-5 ${campaign.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'pending_cert' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {campaign.status === 'active' ? 'Disponible' : campaign.status === 'pending_cert' ? 'Cert. pendiente' : 'Próximamente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{campaign.desc}</p>
                </div>
              </div>
              {campaign.status === 'active' && campaign.href && (
                <p className="text-xs text-green-600 font-medium ml-[52px]">Ir al módulo →</p>
              )}
            </div>
          )
          return campaign.href && campaign.status === 'active' ? (
            <Link key={campaign.name} href={campaign.href}>{card}</Link>
          ) : (
            <div key={campaign.name}>{card}</div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Megaphone className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Módulos relacionados activos</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Segmentos de clientes', href: '/crm/segments' },
            { label: 'Automatizaciones', href: '/crm/automation' },
            { label: 'Follow-ups', href: '/crm/sales/follow-ups' },
            { label: 'NPS', href: '/crm/support/nps' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="px-3 py-2 border border-gray-200 hover:border-green-400 hover:text-green-700 text-gray-600 text-sm font-medium rounded-lg transition-colors">
              {link.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
