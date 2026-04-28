# KINEXIS — Sistema de Temas

## Modos disponibles
- **Dark** (default) — paleta profunda `#0a0e27`, acento neón `#CCFF00`
- **Light** — fondo limpio `#F5F5F7`, misma acento neón `#CDFF00`

## Toggle
El usuario cambia el tema desde el ícono sol/luna en el Header (esquina superior derecha).
La preferencia se persiste en `localStorage` vía `next-themes`.

---

## Tokens CSS disponibles

### Backgrounds
| Variable | Light | Dark |
|---|---|---|
| `--background` | `#FFFFFF` | `#0a0e27` |
| `--bg-base` | `#F5F5F7` | gradient navy |
| `--bg-surface` | `rgba(255,255,255,0.90)` | `rgba(15,23,42,0.7)` |
| `--bg-card` | `rgba(255,255,255,0.85)` | `rgba(30,41,59,0.4)` |
| `--bg-card-hover` | `rgba(255,255,255,1)` | `rgba(51,65,85,0.5)` |

### Texto
| Variable | Light | Dark |
|---|---|---|
| `--text-primary` | `#1A1A1A` | `rgba(255,255,255,0.95)` |
| `--text-secondary` | `#666666` | `rgba(255,255,255,0.65)` |
| `--text-muted` | `#999999` | `rgba(255,255,255,0.4)` |

### Acento / Brand
| Variable | Light | Dark |
|---|---|---|
| `--accent-primary` | `#CDFF00` | `#ccff00` |
| `--accent-secondary` | `#B8E600` | `#7fb518` |
| `--accent-warning` | `#FFCC00` | `#fbbf24` |
| `--accent-danger` | `#FF3B30` | `#f87171` |

### Bordes
| Variable | Light | Dark |
|---|---|---|
| `--border-color` | `#E5E5E5` | `rgba(255,255,255,0.05)` |
| `--border-subtle` | `#D1D1D1` | `rgba(255,255,255,0.05)` |
| `--glass-border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.1)` |

### Sombras
| Variable | Uso |
|---|---|
| `--shadow-sm` | Elementos sutiles (header) |
| `--shadow-md` | Cards, modales |
| `--shadow-lg` | Dropdowns, popovers |
| `--shadow-glow` | Botones con acento |

---

## Usar en componentes nuevos

```tsx
// ✅ CORRECTO — usa CSS vars
<div style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>

// ✅ CORRECTO — clase utility glass-card
<div className="glass-card p-6 rounded-2xl">

// ❌ INCORRECTO — hardcoded dark-only
<div className="bg-[#040f1b] text-white/50">
```

### Regla para textos en charts (Recharts/Chart.js)
Los inline styles de librerías de charting no soportan CSS vars.
Usar `useTheme` de `next-themes`:

```tsx
'use client'
import { useTheme } from 'next-themes'

export function MyChart() {
  const { resolvedTheme } = useTheme()
  const tooltipBg   = resolvedTheme === 'dark' ? '#0a0e27' : '#ffffff'
  const tooltipText = resolvedTheme === 'dark' ? '#ffffff' : '#1a1a1a'

  return (
    <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText }} />
  )
}
```

---

## Clases utilitarias disponibles (globals.css)

| Clase | Descripción |
|---|---|
| `.glass-card` | Glassmorphism con CSS vars (bg, border, shadow) |
| `.neon-disruptor` | CTA button neón (bg acento, texto negro) |
| `.shell-bg` | Fondo de paneles del shell |
| `.animate-in` | Entrada suave (fade + translateY) |
| `.label-tracking` | `letter-spacing: 0.15em` |
| `.tight-tracking` | `letter-spacing: -0.04em` |
| `.drop-shadow-glow` | Glow neón para textos accent |
| `.custom-scrollbar` | Scrollbar minimalista |

---

## Arquitectura del tema

```
next-themes (ThemeProvider)
  └── attribute="class"          → añade .dark o .light a <html>
  └── defaultTheme="dark"
  └── enableSystem=false

globals.css
  └── :root {}                   → tokens light (default)
  └── .dark {}                   → override tokens dark
  └── .light {}                  → override explícito light
  └── html.light .clase {}       → overrides para clases Tailwind hardcodeadas

ThemeToggle.tsx
  └── useTheme() → setTheme('light' | 'dark')
  └── mounted guard (evita hydration mismatch)
```
