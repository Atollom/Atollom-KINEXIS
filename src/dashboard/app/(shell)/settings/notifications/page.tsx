'use client'

import { useState } from 'react'
import { Bell, Save } from 'lucide-react'

interface NotifPrefs {
  low_stock: boolean; overdue_invoices: boolean; new_leads: boolean
  hot_leads: boolean; open_tickets: boolean; cfdi_errors: boolean
  order_cancelled: boolean; daily_summary: boolean
}

const prefs_default: NotifPrefs = {
  low_stock: true, overdue_invoices: true, new_leads: true,
  hot_leads: true, open_tickets: false, cfdi_errors: true,
  order_cancelled: false, daily_summary: false,
}

const labels: Record<keyof NotifPrefs, { label: string; desc: string; category: string }> = {
  low_stock: { label: 'Stock bajo', desc: 'Alerta cuando un SKU cae por debajo del umbral mínimo', category: 'Inventario' },
  overdue_invoices: { label: 'Facturas vencidas', desc: 'Notificar cuentas por cobrar con más de 30 días vencidas', category: 'Finanzas' },
  new_leads: { label: 'Nuevos leads', desc: 'Alerta cuando llega un nuevo prospecto al CRM', category: 'CRM' },
  hot_leads: { label: 'Lead caliente (score ≥70)', desc: 'Notificar cuando un lead alcanza prioridad alta', category: 'CRM' },
  open_tickets: { label: 'Tickets abiertos', desc: 'Recordatorio diario de tickets sin resolver', category: 'Soporte' },
  cfdi_errors: { label: 'Errores de timbrado', desc: 'Alerta inmediata si un CFDI falla en el SAT', category: 'Fiscal' },
  order_cancelled: { label: 'Pedido cancelado', desc: 'Notificar cada vez que se cancela un pedido', category: 'E-commerce' },
  daily_summary: { label: 'Resumen diario', desc: 'Email con métricas del día cada mañana a las 8am', category: 'General' },
}

const categories = ['Inventario', 'Finanzas', 'CRM', 'Soporte', 'Fiscal', 'E-commerce', 'General']

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative w-10 h-5.5 rounded-full transition-colors ${on ? 'bg-green-600' : 'bg-gray-200'}`} style={{ height: '22px' }}>
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4.5' : ''}`} style={{ width: '18px', height: '18px', transform: on ? 'translateX(18px)' : 'none' }} />
    </button>
  )
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(prefs_default)
  const [saved, setSaved] = useState(false)

  function update(key: keyof NotifPrefs, val: boolean) {
    setPrefs(p => ({ ...p, [key]: val }))
  }

  function save() {
    // In production: persist to tenant_settings table
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Configura qué alertas recibes de Samantha y el sistema</p>
        </div>
        <Bell className="w-6 h-6 text-gray-300" />
      </div>

      {categories.map(cat => {
        const catKeys = (Object.keys(labels) as (keyof NotifPrefs)[]).filter(k => labels[k].category === cat)
        if (catKeys.length === 0) return null
        return (
          <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">{cat}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {catKeys.map(key => (
                <div key={key} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{labels[key].label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{labels[key].desc}</p>
                  </div>
                  <Toggle on={prefs[key]} onChange={v => update(key, v)} />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors w-fit">
        <Save className="w-4 h-4" />
        {saved ? '¡Preferencias guardadas!' : 'Guardar preferencias'}
      </button>
    </div>
  )
}
