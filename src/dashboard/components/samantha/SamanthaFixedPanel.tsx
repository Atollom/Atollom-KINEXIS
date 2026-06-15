'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  Send, Sparkles, Paperclip, X, Trash2,
  TrendingUp, ShoppingCart, AlertTriangle,
  ChevronDown, ChevronUp, Ticket,
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { authenticatedFetch } from '@/lib/api-client'
import { useSamanthaMemory } from '@/hooks/useSamanthaMemory'

// ── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string
  name: string
  type: string
  data: string
  preview?: string
}

interface DashboardStats {
  revenue_30d: number
  orders_7d: number
  low_stock_alerts: number
  open_tickets: number
  active_leads: number
}

// ── Page context map ─────────────────────────────────────────────────────────

interface PageCtx {
  label: string
  emoji: string
  greeting: string
  tip: string
  quickActions: string[]
}

const PAGE_CONTEXTS: Record<string, PageCtx> = {
  '/dashboard': {
    label: 'Resumen ejecutivo',
    emoji: '📊',
    greeting: 'Bienvenido al centro de mando. Aquí tienes todo lo importante de un vistazo.',
    tip: 'Puedo mostrarte métricas en tiempo real o preparar un resumen ejecutivo del día.',
    quickActions: ['¿Cómo van mis ventas esta semana?', 'Muéstrame las alertas urgentes', 'Resumen ejecutivo del día'],
  },
  '/ecommerce': {
    label: 'E-commerce',
    emoji: '🛒',
    greeting: 'Panel de e-commerce activo. Tus canales de venta están sincronizados.',
    tip: 'Puedo revisar órdenes pendientes, inventario o generar reportes de ventas por canal.',
    quickActions: ['Órdenes pendientes de hoy', '¿Algún producto sin stock?', 'Comparativa de canales de venta'],
  },
  '/ecommerce/ml': {
    label: 'MercadoLibre',
    emoji: '🟡',
    greeting: 'Conexión con MercadoLibre activa. Monitoreando tus listings y ventas.',
    tip: 'Puedo revisar preguntas sin responder, órdenes para enviar o el posicionamiento de tus publicaciones.',
    quickActions: ['Preguntas sin responder en ML', 'Órdenes pendientes de envío', 'Mis publicaciones más vistas'],
  },
  '/ecommerce/amazon': {
    label: 'Amazon',
    emoji: '📦',
    greeting: 'Conectado a Amazon Seller Central. Inventario FBA en monitoreo constante.',
    tip: 'Puedo revisar el estado del inventario FBA, envíos activos o el account health.',
    quickActions: ['Estado del inventario FBA', 'Envíos en tránsito', 'Account health de mi cuenta'],
  },
  '/ecommerce/shopify': {
    label: 'Shopify',
    emoji: '🟢',
    greeting: 'Shopify sincronizado. Tu tienda online está operativa.',
    tip: 'Puedo consultar órdenes pendientes, devoluciones o el estado de tu catálogo de productos.',
    quickActions: ['Órdenes pendientes Shopify', 'Devoluciones activas', 'Productos agotados en tienda'],
  },
  '/crm': {
    label: 'CRM',
    emoji: '🤝',
    greeting: 'CRM activo. Tus relaciones comerciales bajo control total.',
    tip: 'Puedo mostrarte el pipeline de ventas, leads más calientes o el estado de los tickets de soporte.',
    quickActions: ['¿Cuántos leads activos tengo?', 'Pipeline de ventas actualizado', 'Tickets sin resolver hoy'],
  },
  '/crm/inbox': {
    label: 'Bandeja unificada',
    emoji: '💬',
    greeting: 'Bandeja unificada activa. Todos tus canales de mensajería en uno solo.',
    tip: 'Puedo mostrarte conversaciones pendientes por canal o identificar los leads más calientes de hoy.',
    quickActions: ['Mensajes sin responder por canal', 'Conversaciones activas en WhatsApp', 'Leads nuevos de Instagram hoy'],
  },
  '/crm/pipeline': {
    label: 'Pipeline comercial',
    emoji: '📈',
    greeting: 'Vista del pipeline comercial. Controla cada etapa de tus oportunidades de negocio.',
    tip: 'Puedo analizar tu funnel de conversión o identificar deals que necesitan seguimiento urgente.',
    quickActions: ['Deals en riesgo esta semana', 'Conversión por etapa del funnel', 'Leads más calientes del pipeline'],
  },
  '/erp': {
    label: 'ERP',
    emoji: '⚙️',
    greeting: 'ERP operativo. Finanzas, inventario y logística centralizados.',
    tip: 'Puedo revisar el estado fiscal, alertas de stock crítico o el flujo de caja del mes.',
    quickActions: ['Alertas de stock crítico', 'Flujo de caja del mes actual', 'Facturas CFDI pendientes'],
  },
  '/erp/cfdi': {
    label: 'Facturación CFDI',
    emoji: '🧾',
    greeting: 'Módulo fiscal CFDI activo. Cumplimiento SAT en tiempo real.',
    tip: 'Puedo verificar el estado de tus CFDI, alertas de validación o preparar un reporte fiscal mensual.',
    quickActions: ['CFDIs pendientes de timbrar', 'Alertas de cumplimiento SAT', 'Resumen fiscal del mes'],
  },
  '/erp/inventory': {
    label: 'Inventario',
    emoji: '🏭',
    greeting: 'Control de inventario activo. Stock en tiempo real de todos tus almacenes.',
    tip: 'Puedo identificar productos con stock crítico, movimientos inusuales o generar un reporte de valorización.',
    quickActions: ['Productos en stock crítico', 'Movimientos de inventario de hoy', 'Valorización total del inventario'],
  },
  '/erp/finance': {
    label: 'Finanzas',
    emoji: '💰',
    greeting: 'Módulo financiero activo. Cuentas por cobrar y pagar monitoreadas.',
    tip: 'Puedo mostrarte el flujo de caja, cuentas vencidas o generar un reporte de rentabilidad.',
    quickActions: ['Cuentas por cobrar vencidas', 'Cuentas por pagar esta semana', 'Flujo de caja proyectado'],
  },
}

function getPageCtx(pathname: string): PageCtx {
  if (PAGE_CONTEXTS[pathname]) return PAGE_CONTEXTS[pathname]
  const keys = Object.keys(PAGE_CONTEXTS).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (pathname.startsWith(k)) return PAGE_CONTEXTS[k]
  }
  return PAGE_CONTEXTS['/dashboard']
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : part
    )
    return <span key={i}>{rendered}{i < arr.length - 1 && <br />}</span>
  })
}

function formatMXN(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// ── MetricChip ────────────────────────────────────────────────────────────────

interface MetricChipProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'green' | 'blue' | 'yellow' | 'red'
}

const CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: 'rgba(34,197,94,0.08)',  text: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
  blue:   { bg: 'rgba(59,130,246,0.08)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  yellow: { bg: 'rgba(234,179,8,0.08)',  text: '#ca8a04', border: 'rgba(234,179,8,0.25)' },
  red:    { bg: 'rgba(239,68,68,0.08)',  text: '#f87171', border: 'rgba(239,68,68,0.2)'  },
}

function MetricChip({ icon, label, value, color }: MetricChipProps) {
  const c = CHIP_COLORS[color]
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <span style={{ color: c.text }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: c.text, opacity: 0.7 }}>
          {label}
        </p>
        <p className="text-[13px] font-black leading-none" style={{ color: c.text }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function SamanthaFixedPanel() {
  const pathname = usePathname()
  const ctx = getPageCtx(pathname ?? '/dashboard')

  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [metricsExpanded, setMetricsExpanded] = useState(true)

  const { messages, addMessage, clearHistory } = useSamanthaMemory(userId)
  const sessionId = useRef(`session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auth session
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    function applySession(
      session: { access_token: string; user: { id: string; user_metadata?: Record<string, unknown> } } | null
    ) {
      setToken(session?.access_token ?? null)
      setUserId(session?.user?.id ?? null)
      setTenantId((session?.user?.user_metadata?.tenant_id as string | undefined) ?? null)
    }

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => applySession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Fetch dashboard stats (uses cookie session — no auth header needed)
  useEffect(() => {
    if (!token) return
    setStatsLoading(true)
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [token])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          data: dataUrl.split(',')[1],
          preview: file.type.startsWith('image/') ? dataUrl : undefined,
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id))

  // Quick action: pre-fill input and focus
  const handleQuickAction = useCallback((action: string) => {
    setInput(action)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return

    const currentAttachments = [...attachments]
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      attachments: currentAttachments.map(a => ({ name: a.name, preview: a.preview })),
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    setInput('')
    setAttachments([])
    setIsLoading(true)

    try {
      const res = await authenticatedFetch('/api/samantha/chat', {
        method: 'POST',
        body: JSON.stringify({
          query: userMsg.content,
          history: messages,
          session_id: sessionId.current,
          tenant_id: tenantId,
          supabase_user_id: userId,
          current_page: pathname,
          ...(currentAttachments.length > 0
            ? { attachments: currentAttachments.map(a => ({ name: a.name, type: a.type, data: a.data })) }
            : {}),
        }),
      })
      const data = await res.json()
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || (res.ok
          ? 'Sin respuesta del servidor.'
          : `Error ${res.status}: ${data.error || 'Intenta de nuevo.'}`),
        timestamp: Date.now(),
      })
    } catch {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión con los servidores. Verifica que el backend esté activo.',
        timestamp: Date.now(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-surface)' }}>

      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(204,255,0,0.22) 0%, rgba(100,200,50,0.12) 100%)',
                border: '1.5px solid rgba(204,255,0,0.3)',
                boxShadow: token ? '0 0 14px rgba(204,255,0,0.18)' : 'none',
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            {token && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 animate-pulse"
                style={{ backgroundColor: '#22c55e', borderColor: 'var(--bg-card)' }}
              />
            )}
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Samantha
            </h3>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              {ctx.emoji} {ctx.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMetricsExpanded(e => !e)}
            title={metricsExpanded ? 'Ocultar panel' : 'Ver panel contextual'}
            className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            {metricsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={clearHistory}
            title="Nueva conversación"
            className="p-1.5 rounded-lg opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── CONTEXT PANEL (collapsible) ── */}
      {metricsExpanded && (
        <div
          className="shrink-0 px-3 py-3 space-y-2.5"
          style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        >
          {/* Contextual greeting */}
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, rgba(204,255,0,0.06) 0%, rgba(100,200,50,0.03) 100%)',
              border: '1px solid rgba(204,255,0,0.12)',
            }}
          >
            <p className="text-[11px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {ctx.greeting}
            </p>
            <p className="text-[10px] mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {ctx.tip}
            </p>
          </div>

          {/* KPI strip */}
          {statsLoading && !stats && (
            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1].map(i => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
              ))}
            </div>
          )}
          {stats && (
            <div className="grid grid-cols-2 gap-1.5">
              <MetricChip
                icon={<TrendingUp className="w-3 h-3" />}
                label="Ingresos 30d"
                value={formatMXN(stats.revenue_30d)}
                color="green"
              />
              <MetricChip
                icon={<ShoppingCart className="w-3 h-3" />}
                label="Pedidos 7d"
                value={String(stats.orders_7d)}
                color="blue"
              />
              {stats.low_stock_alerts > 0 && (
                <MetricChip
                  icon={<AlertTriangle className="w-3 h-3" />}
                  label="Stock bajo"
                  value={String(stats.low_stock_alerts)}
                  color="yellow"
                />
              )}
              {stats.open_tickets > 0 && (
                <MetricChip
                  icon={<Ticket className="w-3 h-3" />}
                  label="Tickets"
                  value={String(stats.open_tickets)}
                  color="red"
                />
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Sugerencias rápidas
            </p>
            <div className="flex flex-col gap-1">
              {ctx.quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  disabled={!token}
                  className="text-left text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)'
                    e.currentTarget.style.color = 'var(--accent-primary)'
                    e.currentTarget.style.backgroundColor = 'rgba(204,255,0,0.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div
                className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#000', fontWeight: 600 }}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.attachments.map((a, i) =>
                      a.preview
                        ? <img key={i} src={a.preview} alt={a.name} className="max-h-28 max-w-full rounded-lg object-contain" />
                        : <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-black/10">📎 {a.name}</span>
                    )}
                  </div>
                )}
                {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-[90%]">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'rgba(204,255,0,0.1)',
                    border: '1px solid rgba(204,255,0,0.2)',
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{renderMarkdown(m.content)}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.2)' }}
            >
              <Sparkles className="w-2.5 h-2.5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--accent-primary)', animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT ── */}
      <div
        className="shrink-0"
        style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {attachments.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-1 pl-1.5 pr-1 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: 'rgba(204,255,0,0.1)',
                  border: '1px solid rgba(204,255,0,0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                {a.preview
                  ? <img src={a.preview} alt={a.name} className="w-5 h-5 object-cover rounded" />
                  : <Paperclip className="w-3 h-3 opacity-60" />
                }
                <span className="max-w-[72px] truncate">{a.name}</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3">
          <div className="relative flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!token}
              title="Adjuntar imagen o PDF"
              className="p-2 rounded-lg shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={token ? 'Pregunta a Samantha…' : 'Inicia sesión para chatear'}
              disabled={!token}
              className="flex-1 text-sm rounded-xl pl-4 pr-10 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
            />

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading || !token}
              className="absolute right-2 p-2 disabled:opacity-30 transition-colors"
              style={{ color: input.trim() ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p
            className="text-[9px] text-center font-semibold uppercase tracking-widest mt-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Samantha · solo lectura y análisis
          </p>
        </div>
      </div>
    </div>
  )
}
