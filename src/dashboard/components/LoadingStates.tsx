'use client'

// ── Shimmer base ──────────────────────────────────────────────────────────────

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--bg-card)' }}
    />
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <div
      className="glass-card p-5 space-y-4 animate-pulse rounded-[1.5rem]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-1/2" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Shimmer className="h-8 rounded-xl" />
        <Shimmer className="h-8 rounded-xl" />
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

// ── Table skeleton ────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      {/* Header */}
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Shimmer key={i} className="h-3 rounded" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <Shimmer
                key={j}
                className={`h-3 rounded ${j === 0 ? '' : j === cols - 1 ? 'w-2/3' : 'w-5/6'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── KPI strip skeleton ────────────────────────────────────────────────────────

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <Shimmer className="h-3 w-24 rounded" />
            <Shimmer className="h-8 w-8 rounded-xl" />
          </div>
          <Shimmer className="h-7 w-28 rounded" />
          <Shimmer className="h-2 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Chart skeleton ────────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="h-4 w-40 rounded" />
        <div className="flex gap-2">
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <Shimmer className="w-full rounded-xl" style={{ height }} />
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className = '' }: { size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = { xs: 16, sm: 20, md: 32, lg: 48 }[size]
  const border = { xs: 2, sm: 2, md: 3, lg: 4 }[size]

  return (
    <span
      className={`inline-block flex-shrink-0 rounded-full animate-spin ${className}`}
      style={{
        width: dim,
        height: dim,
        border: `${border}px solid rgba(204,255,0,0.15)`,
        borderTopColor: '#CCFF00',
      }}
      role="status"
      aria-label="Cargando"
    />
  )
}

export function SpinnerPage({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <Spinner size="lg" />
      <p className="text-xs font-black label-tracking" style={{ color: 'var(--text-muted)' }}>
        {message.toUpperCase()}
      </p>
    </div>
  )
}

// ── Loading overlay ───────────────────────────────────────────────────────────

export function LoadingOverlay({ message = 'Procesando...' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(4,15,27,0.7)' }}
    >
      <div
        className="glass-card px-10 py-8 flex flex-col items-center gap-4 rounded-[2rem]"
      >
        <Spinner size="lg" />
        <p className="text-xs font-black label-tracking" style={{ color: 'var(--text-muted)' }}>
          {message.toUpperCase()}
        </p>
      </div>
    </div>
  )
}

// ── Inline loading row ────────────────────────────────────────────────────────

export function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
      <Spinner size="xs" />
      <span className="font-medium">Cargando datos...</span>
    </div>
  )
}
