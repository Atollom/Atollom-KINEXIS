export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div
          className="h-8 rounded-lg w-48"
          style={{ backgroundColor: 'var(--bg-card)' }}
        />
        <div
          className="h-6 rounded-full w-20"
          style={{ backgroundColor: 'var(--bg-card)' }}
        />
      </div>
      <div
        className="h-4 rounded w-72"
        style={{ backgroundColor: 'var(--bg-card)' }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="lg:col-span-2 h-64 rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        />
        <div
          className="h-64 rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
        />
      </div>
    </div>
  )
}
