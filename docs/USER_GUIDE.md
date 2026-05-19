# KINEXIS — Guía de Usuario

**Versión:** 1.0.0-beta  
**Actualizado:** Mayo 2026

---

## Primeros Pasos

### 1. Crear cuenta

1. Visita **https://kinexis.atollom.com**
2. Click **"Iniciar Sesión"**
3. Autentícate con Google o con tu email/contraseña
4. El sistema te redirige automáticamente al **wizard de onboarding**

### 2. Completar el onboarding (5 pasos)

El wizard te guía para configurar tu empresa:

| Paso | Contenido |
|------|-----------|
| 1 | Nombre de empresa y sector |
| 2 | RFC y datos fiscales (para CFDI) |
| 3 | Módulos a activar (E-commerce, CRM, ERP) |
| 4 | Conectar primera integración |
| 5 | Invitar a tu equipo |

Al terminar, serás redirigido al **Dashboard** con tu empresa configurada.

### 3. Conectar integraciones

1. Ve a **Settings → Integrations**
2. Click **"Configurar"** en la integración que necesitas
3. Ingresa las credenciales / autoriza el acceso OAuth
4. Verifica que el badge muestre **"Conectado"**

### 4. Sincronización de datos

- **Automática:** cada 15 minutos (Samantha sincroniza en background)
- **Manual:** Dashboard → click **"Sincronizar"**

---

## Módulos

### Dashboard

Vista general de tu negocio en tiempo real:

- KPIs: ventas del día, semana y mes
- Órdenes pendientes de despacho
- Alertas de stock crítico
- Revenue por canal (ML, Amazon, Shopify, B2B)
- Gráfica de tendencia 30 días

**Nota:** El badge **LIVE** indica datos reales; **SANDBOX** indica datos de demostración.

---

### CRM — Gestión de Clientes

Módulo para gestionar todo el ciclo de ventas.

#### Pipeline

Vista Kanban con deals por etapa:
- **Lead** → Nuevo prospecto
- **Calificado** → Lead con score ≥ 40
- **Propuesta** → Cotización enviada
- **Negociación** → Deal en proceso
- **Cerrado** → Ganado/perdido

Drag & drop para mover deals entre etapas.

#### Segmentos

Clientes agrupados por comportamiento:
- **VIP** — Score ≥ 80 (máxima prioridad)
- **Regular** — Score 50–79 (mantenimiento)
- **En riesgo** — Score 30–49 (requiere atención)
- **Churn inminente** — Score < 30 (riesgo alto)

#### Portal B2B

Cuentas corporativas con:
- Health score (0–100)
- MRR (Monthly Recurring Revenue)
- Historial de compras
- Contactos de la empresa

#### Automation

Cola de seguimientos automáticos. Puedes activar/pausar cada flujo:
- Recordatorio de cotización
- Follow-up post-venta
- Alerta de churn

#### Loyalty

Programa de lealtad por tiers:
- **Platinum** — Health score ≥ 80
- **Gold** — Health score 60–79
- **Silver** — Health score < 60

#### Campaigns

Historial de campañas y respuestas NPS.

#### Reports

Snapshots de pipeline: conversión, revenue generado, tiempo promedio de cierre.

---

### ERP — Gestión Operativa

#### Finanzas

- **AR (Cuentas por cobrar):** aging por bucket (0–30 / 31–60 / 61–90 / >90 días)
- **AP (Cuentas por pagar):** resumen de proveedores
- **Snapshot:** revenue, COGS, utilidad bruta del mes

#### Inventario

- Lista de SKUs con stock, costo y valor total
- Movimientos de entrada/salida con timestamps
- Alertas de stock mínimo

#### Compras

- Órdenes de compra a proveedores
- Estados: Borrador → Enviada → Recibida
- Evaluar proveedores

#### CFDI / Facturación

- Generar facturas CFDI 4.0 via FacturAPI
- Cancelar facturas (flujo SAT)
- Descargar XML + PDF
- Monitor de uso de timbres por período

---

### Operations — Operaciones Diarias

#### Fulfillment

Órdenes pendientes de despacho con acciones:
- **DESPACHAR** → cambia estado a `SENT`
- Filtrar por plataforma (ML, Amazon, Shopify, B2B)
- Vista de urgencias por antigüedad

#### Cotizador de Envíos

1. Ingresa CP origen, CP destino, peso y valor declarado
2. Click **"COTIZAR"**
3. Compara tarifas de FedEx, DHL, Estafeta, RedPack, Sendex
4. Click **"SELECCIONAR"** para usar la tarifa elegida

#### Almacén

- Inventario agrupado por ubicación física
- Filtros: Todos / Stock Bajo / Agotados
- Búsqueda por SKU o ubicación
- Valor total por zona

#### Calidad

- **Devoluciones:** historial de returns con motivo y estado
- **Tickets de soporte:** por prioridad (Alta / Media / Baja)
- KPIs: open tickets, returns pendientes, alta prioridad

---

### Analytics — Reportes Avanzados

#### Ventas (30 días)

- Revenue total, número de órdenes, ticket promedio
- Gráfica de barras: revenue por canal
- Gráfica de línea: tendencia diaria
- Tabla desglose por canal con barra de porcentaje

#### Inventario

- Valor total del stock, SKUs, items bajos, agotados
- Gráfica de movimientos (entradas vs salidas) 14 días
- Lista de stock crítico con cantidad actual vs mínimo

#### Clientes

- B2C: clientes únicos, LTV promedio, nuevos leads, leads calientes
- B2B: número de cuentas, MRR, salud promedio
- Órdenes por canal con distribución porcentual

---

### E-commerce

#### Catálogo Unificado

Vista de todos los productos desde una sola pantalla:
- SKU, nombre, categoría
- Precio base y costo
- Margen calculado automáticamente (verde ≥40% / amarillo ≥20% / rojo <20%)
- Badge "KIT" para productos compuestos

#### Promociones

Gestión de descuentos multi-plataforma:
- Descuentos porcentuales, envío gratis, 2x1, cashback
- Activa/pausa con un click
- Barra de progreso de uso

#### Mercado Libre, Amazon, Shopify

Vistas por canal con datos específicos de cada plataforma (órdenes, productos, analytics).

---

### Settings — Configuración

#### Perfil

- Datos personales (nombre, teléfono)
- Datos fiscales (razón social, RFC, régimen fiscal, CP)
- Cambio de contraseña

#### Usuarios & Roles

- Lista de usuarios del tenant
- Cambiar rol de cualquier usuario (excepto Owner)
- Roles disponibles: Admin, Agente, Almacenista, Contador, Viewer

Para cambiar un rol:
1. Hover sobre el usuario
2. Click **"EDITAR"**
3. Seleccionar nuevo rol en el dropdown
4. Click **"OK"**

#### Billing & Planes

| Plan | Precio | Módulos |
|------|--------|---------|
| Starter | $6,500 MXN/mes | 1 módulo |
| Growth | $10,500 MXN/mes | 2 módulos |
| Pro | $16,500 MXN/mes | Suite completa |

Para cambiar de plan: click **"Cambiar a [Plan]"** → redirect a Stripe Checkout.

Para gestionar tu suscripción: click **"Portal de Facturación"** → Stripe Customer Portal.

#### Integraciones

Para conectar una API:
1. Click **"Editar"** en la integración
2. Pega tu API key
3. Click **"GUARDAR"**

Para integraciones OAuth (Amazon, ML): click **"Conectar"** → autoriza en la plataforma → regresa automáticamente.

#### Seguridad

- Lista de API keys configuradas (nombres solo, nunca valores)
- Botón de cambio de contraseña (envía email de reset)
- Audit log de los últimos 50 cambios de configuración

#### Notificaciones

- Activa/desactiva notificaciones por evento
- Configura webhook de Slack
- Configura número de WhatsApp para alertas

---

## Samantha AI

### ¿Qué es Samantha?

Samantha es tu asistente virtual que puede ejecutar acciones reales en tu negocio, no solo responder preguntas.

### Cómo usarla

1. El panel de Samantha está en el lado derecho (desktop) o en el ícono de chat (móvil)
2. Escribe tu pregunta o solicitud en lenguaje natural
3. Samantha procesa con 43 agentes especializados y responde en segundos

### Ejemplos de uso

```
"¿Cuántas órdenes tengo pendientes de despacho?"
"Muéstrame el inventario bajo en stock"
"¿Cuál fue mi producto más vendido esta semana?"
"¿Cuánto revenue generé este mes en Mercado Libre?"
"Ayúdame a crear una cotización para un cliente"
"¿Qué leads no he contactado en 3 días?"
"¿Cuántos timbres CFDI me quedan?"
"Resume mi situación financiera"
```

### Alerta proactiva

Cuando saludas a Samantha ("Hola", "Buenos días"), ella detecta automáticamente situaciones urgentes:
- Stock crítico en productos
- Órdenes sin facturar
- Pagos vencidos
- Leads sin seguimiento

---

## Preguntas Frecuentes

**¿Cómo cambio mi plan?**  
Settings → Billing → click en el plan que quieres → Stripe Checkout

**¿Cómo invito a mi equipo?**  
Settings → Usuarios → click **"INVITAR USUARIO"** → se envía email de activación

**¿Cómo descargo un reporte?**  
Analytics → sección → botón **"Exportar"** (próximamente)

**¿Cómo contacto soporte?**  
- Chat con Samantha
- Email: soporte@kinexis.com

**¿Mis datos están seguros?**  
Sí. Cada empresa tiene su propio aislamiento de datos (Row Level Security en base de datos). Ningún tenant puede ver datos de otro.

**¿Cuándo se sincronizan mis datos de ML/Amazon/Shopify?**  
Automáticamente cada 15 minutos. Puedes forzar una sincronización desde el Dashboard.

**¿Puedo usar KINEXIS desde el celular?**  
Sí, el dashboard es completamente responsive. En móvil, la navegación se mueve a la barra inferior.

**¿Qué pasa si me quedo sin créditos de Samantha?**  
Samantha pausará las respuestas IA hasta el próximo ciclo de facturación. Los datos del dashboard siguen disponibles.

---

## Soporte

| Canal | Disponibilidad |
|-------|---------------|
| Samantha AI (chat) | 24/7 |
| Email soporte@kinexis.com | Respuesta 24h |
| Onboarding call | Con plan Growth y Pro |

---

*KINEXIS © 2026 Atollom Labs · Todos los derechos reservados*
