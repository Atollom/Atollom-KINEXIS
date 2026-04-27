'use client'

import { useState } from 'react'
import { ShoppingCart, MessageSquare, Receipt, BarChart3, Package } from 'lucide-react'
import Image from 'next/image'

// ── Carousel ──────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: 'general',
    label: 'Dashboard General',
    icon: BarChart3,
    title: 'Centro de Comando KINEXIS',
    description: 'Vista panorámica de toda tu operación. Métricas clave en tiempo real, alertas del sistema y resumen financiero de todos tus canales.',
    img: '/screenshots/general.webp'
  },
  {
    id: 'amazon',
    label: 'Amazon FBA',
    icon: ShoppingCart,
    title: 'Amazon SP-API Integrado',
    description: 'Gestiona tu inventario FBA, calcula márgenes exactos incluyendo fees de Amazon y sincroniza órdenes instantáneamente.',
    img: '/screenshots/amazon.webp'
  },
  {
    id: 'shopify',
    label: 'Shopify',
    icon: ShoppingCart,
    title: 'Sincronización D2C Shopify',
    description: 'Tu tienda directa al consumidor en perfecta armonía con tu ERP. Stock unificado para evitar sobreventas.',
    img: '/screenshots/shopify.webp'
  },
  {
    id: 'crm',
    label: 'CRM Omnicanal',
    icon: MessageSquare,
    title: 'Inbox Omnicanal + CRM',
    description: 'Bandeja unificada de WhatsApp, Instagram y Facebook. Pipeline de ventas con scoring de leads automático impulsado por IA.',
    img: '/screenshots/omnicanal.webp'
  },
  {
    id: 'erp',
    label: 'Warehouse & ERP',
    icon: Package,
    title: 'Logística y Almacén',
    description: 'Gestión avanzada de ubicaciones, picking y packing con validación de Samantha AI para evitar errores en envíos.',
    img: '/screenshots/warehouse.webp'
  },
]

export function ScreenshotsCarousel() {
  const [active, setActive] = useState<string>('general')

  const tab = TABS.find(t => t.id === active)!

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#CCFF00] text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Text */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-3">{tab.title}</h3>
          <p className="text-white/60 leading-relaxed">{tab.description}</p>
        </div>

        {/* Screenshot View */}
        <div className="rounded-2xl bg-[#040f1b] border border-white/10 overflow-hidden shadow-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/10 bg-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <div className="flex-1 mx-3 bg-white/10 rounded h-4" />
          </div>
          <div className="relative aspect-[16/9] w-full">
            <Image 
              src={tab.img} 
              alt={tab.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  )
}
