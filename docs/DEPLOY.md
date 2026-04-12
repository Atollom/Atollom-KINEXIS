# Guía de Despliegue — Atollom KINEXIS

Esta guía detalla el proceso para desplegar el ecosistema KINEXIS a entornos de staging/producción.

## 1. Supabase (Base de Datos y Auth)
1. **Migraciones**: Ejecutar todas las migraciones en la base de datos de destino.
   - Usar la CLI de Supabase: `supabase db push`
   - O copiar el contenido de `/migrations` en el SQL Editor de Supabase.
2. **Políticas RLS**: Verificar que las políticas de Tenant Isolation estén activas.
3. **Vault**: Configurar los secretos en `vault.secrets` para los agentes que lo requieran.

## 2. Railway (Backend Python)
1. **Conectar Repositorio**: Vincular el repositorio a un nuevo servicio en Railway.
2. **Configuración**: Railway detectará automáticamente el `railway.json` en `/src/`.
3. **Variables de Entorno**: Configurar todas las variables definidas en `.env.example` en el dashboard de Railway.
4. **Despliegue**: Railway usará NIXPACKS para construir la imagen e iniciar con `uvicorn`.

## 3. Vercel (Dashboard Next.js)
1. **Configurar Proyecto**: Crear un nuevo proyecto en Vercel apuntando a `/src/dashboard/`.
2. **Variables de Entorno**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
3. **Build Settings**: Vercel usará automáticamente `vercel.json` para definir los comandos de construcción.

## 4. Verificación de Conexiones
1. **Health Check**: Acceder a `https://tu-url-railway.app/health` para verificar el estado del backend.
2. **Dashboard Login**: Verificar que el login funciona y redirige correctamente usando Supabase Auth.
3. **Agentes**: Probar un webhook de prueba (ej. WhatsApp) para verificar la trazabilidad en la base de datos.

## 5. ROLLBACK — Cómo revertir fallos
Si algo falla durante el despliegue, seguir estos pasos:

### Supabase
- **Rollback de Migraciones**: Si una migración falla, restaurar un backup previo o ejecutar scripts de "down" si están disponibles.
- **Importante**: Siempre realizar un backup antes de ejecuciones masivas en producción.

### Railway
- **Revertir Deploy**: Ir al dashboard de Railway, seleccionar el servicio y en la pestaña "Deployments", seleccionar la versión anterior y hacer clic en "Redeploy".

### Vercel
- **Instant Rollback**: En el dashboard de Vercel, navegar a "Deployments", buscar la versión estable anterior y seleccionar "Rollback". Esto redirigirá el tráfico instantáneamente.

---
*Estado del Deploy: READY_FOR_STAGING*
