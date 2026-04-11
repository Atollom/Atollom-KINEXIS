export function SystemMetrics() {
  return (
    <section
      className="
        col-span-12 bg-surface-container-high rounded-xl p-6 md:p-8
        relative overflow-hidden h-52 flex flex-col justify-end
      "
      aria-label="Métricas del sistema"
    >
      {/* Background SVG wave texture */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none p-6" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <path
            d="M0,150 Q250,50 500,120 T1000,80 L1000,200 L0,200 Z"
            fill="#cafd00"
          />
          <path
            d="M0,160 Q200,80 400,140 T800,100 T1000,120"
            fill="none"
            stroke="#cafd00"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Metrics row */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        <div>
          <p className="label-sm text-on-surface-variant mb-2">Latencia API</p>
          <p className="text-2xl font-bold font-headline text-primary-container">14ms</p>
        </div>
        <div>
          <p className="label-sm text-on-surface-variant mb-2">Tokens Hoy</p>
          <p className="text-2xl font-bold font-headline text-primary-container">88.4M</p>
        </div>
        <div>
          <p className="label-sm text-on-surface-variant mb-2">Neural Load</p>
          <div className="w-full h-1.5 bg-surface-container-lowest rounded-full mt-3 overflow-hidden">
            <div
              className="h-full w-[65%] bg-primary-container rounded-full"
              style={{ boxShadow: "0 0 5px #cafd00" }}
              role="progressbar"
              aria-valuenow={65}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Carga neural: 65%"
            />
          </div>
        </div>
        <div>
          <p className="label-sm text-on-surface-variant mb-2">Sync Delta</p>
          <p className="text-2xl font-bold font-headline text-on-surface">0.002s</p>
        </div>
        <div>
          <p className="label-sm text-on-surface-variant mb-2">Tests</p>
          <p className="text-2xl font-bold font-headline text-primary-container">710/710</p>
        </div>
        <div className="flex items-end">
          <button
            className="btn-volt w-full py-2.5 text-center"
            aria-label="Descargar log del sistema"
          >
            System Log
          </button>
        </div>
      </div>
    </section>
  );
}
