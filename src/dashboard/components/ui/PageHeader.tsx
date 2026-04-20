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
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">{title}</h1>
          {badge && (
            <span className="px-2.5 py-1 bg-[#CCFF00]/10 text-[#CCFF00]/80 text-xs font-semibold rounded-full border border-[#CCFF00]/20">
              Agente {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1.5 text-sm text-white/50">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
