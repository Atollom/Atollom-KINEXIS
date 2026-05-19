'use client'

export default function SentryTestPage() {
  return (
    <div className="space-y-6 animate-in">
      <header className="space-y-2">
        <span className="text-[0.75rem] font-bold label-tracking text-red-400">
          Debug / Sentry Test
        </span>
        <h1 className="text-4xl font-black tight-tracking text-on-surface">Sentry Test</h1>
        <p className="text-sm text-on-surface-variant">Sólo visible para desarrollo. Eliminar antes de v1 final.</p>
      </header>

      <div className="glass-card rounded-[2rem] border border-red-400/20 p-8 space-y-4">
        <p className="text-sm text-on-surface/60">
          Haz click en el botón para generar un error de prueba en Sentry. Verifica que aparece
          en el dashboard de Sentry antes de hacer deploy.
        </p>
        <button
          onClick={() => {
            throw new Error('KINEXIS Sentry Test — Frontend Error')
          }}
          className="px-6 py-3 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] font-black label-tracking hover:bg-red-400/20 transition-all"
        >
          TRIGGER TEST ERROR
        </button>
      </div>
    </div>
  )
}
