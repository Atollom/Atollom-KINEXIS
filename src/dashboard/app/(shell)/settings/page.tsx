'use client'

import Link from 'next/link'
import { User, Building2, Lock, Bell, Users, CreditCard, Globe, Shield } from 'lucide-react'

const sections = [
  { title: 'Perfil', description: 'Nombre, email y preferencias personales', href: '/settings/profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Organización', description: 'Datos del tenant, RFC y configuración fiscal', href: '/settings/integrations', icon: Building2, color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'Usuarios y roles', description: 'Gestión de accesos RBAC (5 roles)', href: '/settings/users', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'Seguridad', description: 'Contraseña, 2FA y sesiones activas', href: '/settings/security', icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
  { title: 'Notificaciones', description: 'Alertas de stock, leads y facturas', href: '/settings/notifications', icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { title: 'Facturación', description: 'Plan, uso de agentes y métodos de pago', href: '/settings/billing', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'Integraciones', description: 'APIs conectadas: ML, Amazon, Shopify, WhatsApp', href: '/settings/integrations', icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { title: 'Permisos y RLS', description: 'Row Level Security y políticas de acceso', href: '/settings/security', icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100' },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Ajusta tu cuenta, organización y preferencias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(sec => {
          const Icon = sec.icon
          return (
            <Link key={sec.href + sec.title} href={sec.href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
              <div className={`inline-flex p-2.5 rounded-xl ${sec.bg} mb-4`}>
                <Icon className={`w-5 h-5 ${sec.color}`} />
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors mb-1">{sec.title}</h2>
              <p className="text-sm text-gray-500">{sec.description}</p>
              <p className="text-xs text-green-600 mt-3 font-medium">Ir a ajustes →</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
