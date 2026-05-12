'use client'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    icon?: string
    onClick: () => void
  }
  compact?: boolean
}

export function EmptyState({ icon = 'inbox', title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center ${compact ? 'py-10' : 'py-20'}`}>
      <div className="text-center max-w-xs animate-in">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <span
            className="material-symbols-outlined !text-[28px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {icon}
          </span>
        </div>
        <h3
          className="text-sm font-bold mb-1.5 tight-tracking"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        <p
          className="text-xs leading-relaxed mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          {description}
        </p>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#000',
            }}
          >
            {action.icon && (
              <span className="material-symbols-outlined !text-[14px]">{action.icon}</span>
            )}
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Domain-specific variants ──────────────────────────────────────────────────

export function NoProductsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="inventory_2"
      title="Sin productos"
      description="No hay productos registrados. Sincroniza tus canales o agrega uno manualmente."
      action={onAdd ? { label: 'Agregar producto', icon: 'add', onClick: onAdd } : undefined}
    />
  )
}

export function NoOrdersEmpty({ onSync }: { onSync?: () => void }) {
  return (
    <EmptyState
      icon="shopping_cart"
      title="Sin órdenes"
      description="Las órdenes de tus canales de venta aparecerán aquí automáticamente."
      action={onSync ? { label: 'Sincronizar ahora', icon: 'sync', onClick: onSync } : undefined}
    />
  )
}

export function NoMessagesEmpty({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon="chat_bubble_outline"
      title="Bandeja vacía"
      description="Conecta WhatsApp, Instagram o Facebook para recibir mensajes aquí."
      action={onConnect ? { label: 'Conectar canal', icon: 'link', onClick: onConnect } : undefined}
    />
  )
}

export function NoDataEmpty({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon="data_object"
      title="Sin datos"
      description="No hay datos disponibles. Intenta sincronizar tus integraciones."
      action={onRefresh ? { label: 'Sincronizar', icon: 'refresh', onClick: onRefresh } : undefined}
    />
  )
}

export function NoLeadsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="person_search"
      title="Sin leads"
      description="Captura tus primeros leads o importa desde tus canales de venta."
      action={onAdd ? { label: 'Agregar lead', icon: 'person_add', onClick: onAdd } : undefined}
    />
  )
}

export function SearchEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      compact
      icon="search_off"
      title="Sin resultados"
      description={`No encontramos nada para "${query}". Intenta con otros términos.`}
    />
  )
}

export function ErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="error_outline"
      title="Error al cargar"
      description="Ocurrió un problema al obtener los datos. Por favor intenta nuevamente."
      action={onRetry ? { label: 'Reintentar', icon: 'refresh', onClick: onRetry } : undefined}
    />
  )
}
