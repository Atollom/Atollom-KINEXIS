'use client'

import { Globe, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react'

const integrations = [
  {
    name: 'Supabase', category: 'Base de datos', status: 'active',
    description: 'PostgreSQL 15 con RLS y Auth. Base principal de KINEXIS.',
    docs: 'https://supabase.com/docs',
  },
  {
    name: 'FacturAPI (CFDI)', category: 'Fiscal', status: 'active',
    description: 'Timbrado de CFDIs 4.0 ante el SAT. Integración con Agente #13.',
    docs: 'https://www.facturapi.io/docs',
  },
  {
    name: 'Skydropx', category: 'Logística', status: 'active',
    description: 'Generación de guías y comparador de paqueterías.',
    docs: 'https://skydropx.com/docs',
  },
  {
    name: 'Stripe', category: 'Pagos', status: 'active',
    description: 'Procesamiento de suscripciones de KINEXIS.',
    docs: 'https://stripe.com/docs',
  },
  {
    name: 'Mercado Libre', category: 'E-commerce', status: 'pending',
    description: 'En espera de certificación de desarrollador. Productos, pedidos y fulfillment.',
    docs: 'https://developers.mercadolibre.com.mx',
  },
  {
    name: 'Amazon MWS/SP-API', category: 'E-commerce', status: 'pending',
    description: 'En espera de aprobación de cuenta de vendedor. FBA y analíticas.',
    docs: 'https://developer.amazonservices.com',
  },
  {
    name: 'Shopify', category: 'E-commerce', status: 'pending',
    description: 'En espera de aprobación de partner. Pedidos, productos y fulfillment.',
    docs: 'https://shopify.dev/docs/api',
  },
  {
    name: 'WhatsApp Business', category: 'Mensajería', status: 'pending',
    description: 'En espera de aprobación de Meta. Inbox y automatización de mensajes.',
    docs: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    name: 'Instagram Graph', category: 'Mensajería', status: 'pending',
    description: 'DMs de Instagram. Pendiente certificación Meta.',
    docs: 'https://developers.facebook.com/docs/instagram-api',
  },
  {
    name: 'Facebook Graph', category: 'Mensajería', status: 'pending',
    description: 'Messenger de Facebook. Pendiente certificación Meta.',
    docs: 'https://developers.facebook.com/docs',
  },
  {
    name: 'Anthropic Claude', category: 'IA', status: 'active',
    description: 'Samantha AI y agentes especializados. Modelo principal: claude-sonnet-4-6.',
    docs: 'https://docs.anthropic.com',
  },
  {
    name: 'Google Gemini', category: 'IA', status: 'active',
    description: 'Proveedor alternativo de LLM. Gemini 2.5 Flash para respuestas de bajo costo.',
    docs: 'https://ai.google.dev/docs',
  },
]

const statusConfig = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
  error: { label: 'Error', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
}

const categories = ['Todos', 'Base de datos', 'E-commerce', 'Mensajería', 'Fiscal', 'Logística', 'Pagos', 'IA']

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
          <p className="text-sm text-gray-500 mt-1">Estado de todas las APIs y servicios conectados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{integrations.filter(i => i.status === 'active').length} activas · {integrations.filter(i => i.status === 'pending').length} pendientes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map(intg => {
          const sc = statusConfig[intg.status as keyof typeof statusConfig]
          return (
            <div key={intg.name} className={`bg-white rounded-xl shadow-sm border p-5 ${intg.status === 'pending' ? 'border-yellow-100 opacity-75' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{intg.name}</h3>
                  <span className="text-xs text-gray-400">{intg.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {sc.icon}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">{intg.description}</p>
              <a href={intg.docs} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
                <ExternalLink className="w-3 h-3" />
                Ver documentación
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
