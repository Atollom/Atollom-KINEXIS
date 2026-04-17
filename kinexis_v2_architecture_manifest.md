# Kinexis V3: The Purge - Architectural Manifest

> [!CAUTION]
> **ESTADO: KINEXIS_V3_LUXE.** La arquitectura visual ha sido purgada íntegramente de cualquier rastro de estética 'Cyberpunk'. El sistema se rige bajo las Leyes de la Columna y el Cristal Líquido.

## 1. Arquitectura de 3 Columnas ( Concierge Fixed)
- **Columna Izquierda (Sidebar - 280px):** Navegación jerárquica con Acordeones Píldora. Gating de Tenancy activo (ERP oculto para Starter).
- **Columna Central (Workspace - Fluid):** Núcleo Operativo Bento. Tarjetas de 3.5rem de radio. Telemetría operacional densa.
- **Columna Derecha (Samantha Concierge - 320px):** Columna fija dedicada a la IA. No es una burbuja. Despliegue de contexto profundo y chat neural.

## 2. Sistema de Diseño "Pristine V3" (Leyes de Estética)
- **Ley de la No-Línea:** BLOQUEO TOTAL DE BORDES. Queda prohibido el uso de la propiedad `border`. La profundidad se logra mediante sombras `ambient` y `glow`.
- **Ley del Fondo:** El único fondo permitido es el Navy Kinexis (`#040f1b`).
- **Ley de la Geometría:** Tarjetas = `rounded-[3.5rem]`. Interactivos = `rounded-full`.
- **Ley del Neón:** El `#CCFF00` se reserva exclusivamente para métricas críticas y CTAs maestros.

## 3. Tenancy & Gating
- El componente `SidebarNav` filtra dinámicamente según el `planId` inyectado. La manipulación de planes se realiza exclusivamente mediante el `DashboardShell`.

---
**Kinexis V3: Purificado. Líquido. Indestructible.**
