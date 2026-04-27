# KINEXIS - Actualización Crítica para Demo (V4.2)

## Resumen de Cambios

### 1. Sistema Light Mode unificado (`globals.css`)
- Se reestructuró el CSS para utilizar variables estandarizadas (`--background`, `--foreground`, `--card`, `--primary`).
- Se eliminaron los overrides manuales que forzaban la oscuridad sobre el modo claro.
- El DashboardOwner ahora puede cambiar limpiamente entre Light y Dark Mode preservando legibilidad.

### 2. Dashboard Conectado a PostgreSQL (FastAPI)
- **Backend:** Se creó el enrutador `dashboard_router.py` con un endpoint nativo `GET /api/dashboard/stats/{tenant_id}` usando `psycopg2`.
- **Frontend:** Se implementó una ruta Proxy en `api/dashboard/stats/route.ts` que consulta al backend de forma segura y maneja cachés si se requiere.
- **UI:** El componente `DashboardOwner.tsx` ahora carga dinámicamente las métricas reales de: Ingresos, Productos, Órdenes Totales y Facturas Timbradas.

### 3. Seed "Orthocardio" Directo a DB
- Se creó `backend/scripts/seed_orthocardio.py`.
- No requiere latencia de Supabase PostgREST, ya que inserta directamente en PostgreSQL con sintaxis `ON CONFLICT DO UPDATE`.
- Inserta: el tenant "Orthocardio", la configuración fiscal bajo régimen 612, 3 usuarios (Dr. Roberto, Ana, Carlos), y 5 facturas aleatorias simulando servicios médicos, demostrando que el sistema también opera en el modo "sin inventario/productos".

### 4. Samantha IA Flotante Estilo Claude
- **Componente:** `SamanthaChat.tsx` flotante, minimizable y anclado a la esquina inferior derecha.
- **Animaciones e Interfaz:** Ventana con gradientes verdes KINEXIS, glassmorphism, indicador de pulso en línea y auto-scroll de mensajes.
- **Backend Mock:** Endpoint en FastAPI (`samantha_router.py`) con detección básica de intenciones (daily_summary, help, general_query).

## Pasos para Despliegue

1. **Backend:**
   Al hacer push, Railway redesplegará el contenedor de FastAPI de forma automática. 
   **Importante:** Verifica en las variables de entorno de Railway que `DATABASE_URL` esté configurado.

2. **Ejecutar Seed:**
   Desde la terminal de Railway o local:
   ```bash
   python backend/scripts/seed_orthocardio.py
   ```

3. **Frontend Vercel:**
   ```bash
   cd src/dashboard
   vercel --prod
   ```

El sistema estará 100% operativo y listo para mostrar estadísticas reales de la base de datos sin bugs visuales en modo claro.
