'use client'

import { MessageSquare, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const channels = [
  { name: 'WhatsApp Business', href: '/crm/inbox/whatsapp', color: 'bg-green-100 text-green-700', status: 'pending', icon: '💬' },
  { name: 'Instagram DM', href: '/crm/inbox/instagram', color: 'bg-pink-100 text-pink-700', status: 'pending', icon: '📸' },
  { name: 'Facebook Messenger', href: '/crm/inbox/facebook', color: 'bg-blue-100 text-blue-700', status: 'pending', icon: '📘' },
  { name: 'Inbox Unificado', href: '/crm/inbox/unified', color: 'bg-purple-100 text-purple-700', status: 'pending', icon: '📥' },
]

export default function InboxPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inbox de Mensajería</h1>
        <p className="text-sm text-gray-500 mt-1">Mensajes unificados de WhatsApp, Instagram y Facebook</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-800">En espera de certificación Meta</p>
          <p className="text-sm text-yellow-700 mt-1">
            Las integraciones de WhatsApp Business, Instagram Graph y Facebook Messenger requieren aprobación del programa de desarrolladores de Meta.
            Esta sección se activará automáticamente una vez obtenida la certificación.
          </p>
          <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 font-medium mt-2">
            <ExternalLink className="w-3 h-3" />
            Meta for Developers
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map(ch => (
          <div key={ch.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{ch.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{ch.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ch.color}`}>Pendiente certificación</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Disponible próximamente</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          Mientras tanto — soporte activo
        </h2>
        <p className="text-sm text-gray-500 mb-3">Gestiona las consultas de clientes a través del módulo de soporte:</p>
        <Link href="/crm/support/tickets" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          Ver Tickets de Soporte →
        </Link>
      </div>
    </div>
  )
}
