interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {badge && (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-full border"
              style={{
                backgroundColor: 'rgba(205,255,0,0.1)',
                color: 'var(--accent-primary)',
                borderColor: 'rgba(205,255,0,0.2)',
              }}
            >
              Agente {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
