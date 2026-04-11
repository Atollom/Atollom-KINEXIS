"use client";

export function Header() {
  return (
    <header
      className="
        fixed top-0 right-0 left-0 md:left-64 z-40
        flex items-center justify-between
        h-16 px-6
        bg-surface/80 backdrop-blur-xl
        shadow-header
      "
      aria-label="Barra de navegación superior"
    >
      {/* Left: title */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger (sidebar toggled via BottomNav on mobile) */}
        <button
          className="md:hidden text-primary-container hover:opacity-80 transition-opacity"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1
          className="
            font-headline font-black italic text-base tracking-tight
            text-primary-container uppercase
          "
        >
          Neural Command Center
        </h1>
      </div>

      {/* Right: agents counter + actions */}
      <div className="flex items-center gap-6">
        {/* Agents online pill */}
        <div
          className="hidden sm:flex items-center gap-2"
          aria-label="Agentes en línea"
        >
          <span
            className="w-2 h-2 rounded-full bg-primary-container"
            style={{ boxShadow: "0 0 6px rgba(202,253,0,0.6)" }}
            aria-hidden="true"
          />
          <span className="label-sm text-primary-container">
            43 AGENTES ONLINE
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <button
            className="text-on-surface-variant hover:text-primary-container transition-colors"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="text-on-surface-variant hover:text-primary-container transition-colors"
            aria-label="Configuración"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
