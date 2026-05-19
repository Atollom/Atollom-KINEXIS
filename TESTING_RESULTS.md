# KINEXIS — Testing Results

**Fecha:** ____________  
**Tester:** ____________  
**Entorno:** ☐ Sandbox  ☐ Production  
**URL:** https://kinexis.atollom.com

---

## 1. Onboarding Flow

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Nuevo usuario creado en Supabase auth.users | ☐ PASS ☐ FAIL | |
| 2 | Login redirige a `/onboarding` (no tiene tenant) | ☐ PASS ☐ FAIL | |
| 3 | Paso 1 onboarding: datos empresa | ☐ PASS ☐ FAIL | |
| 4 | Paso 2 onboarding: datos fiscales | ☐ PASS ☐ FAIL | |
| 5 | Paso 3 onboarding: selección módulos | ☐ PASS ☐ FAIL | |
| 6 | Paso 4 onboarding: integraciones | ☐ PASS ☐ FAIL | |
| 7 | Paso 5 onboarding: invitar equipo | ☐ PASS ☐ FAIL | |
| 8 | Al completar: redirige a `/dashboard` | ☐ PASS ☐ FAIL | |
| 9 | Tenant creado en tabla `tenants` | ☐ PASS ☐ FAIL | |
| 10 | Usuario vinculado en tabla `users` con tenant_id | ☐ PASS ☐ FAIL | |
| 11 | Email bienvenida recibido (verificar Resend logs) | ☐ PASS ☐ FAIL | |

---

## 2. Dashboard

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 12 | Stats cards muestran números (no NaN) | ☐ PASS ☐ FAIL | |
| 13 | Gráficas renderizan sin errores | ☐ PASS ☐ FAIL | |
| 14 | Badge LIVE/SANDBOX correcto | ☐ PASS ☐ FAIL | |
| 15 | Urgencias panel muestra alerts si existen | ☐ PASS ☐ FAIL | |
| 16 | Sin errores en DevTools console | ☐ PASS ☐ FAIL | |

---

## 3. CRM

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 17 | Pipeline: Kanban carga deals | ☐ PASS ☐ FAIL | |
| 18 | Segments: muestra leads agrupados por score | ☐ PASS ☐ FAIL | |
| 19 | Portal B2B: carga cuentas corporativas | ☐ PASS ☐ FAIL | |
| 20 | Automation: muestra cola de seguimientos | ☐ PASS ☐ FAIL | |
| 21 | Loyalty: muestra tiers Platinum/Gold/Silver | ☐ PASS ☐ FAIL | |
| 22 | Campaigns: muestra historial | ☐ PASS ☐ FAIL | |
| 23 | Reports: muestra snapshots de pipeline | ☐ PASS ☐ FAIL | |

---

## 4. ERP

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 24 | Finance: AR aging buckets visibles | ☐ PASS ☐ FAIL | |
| 25 | Finance: AP summary visible | ☐ PASS ☐ FAIL | |
| 26 | CFDI: lista facturas | ☐ PASS ☐ FAIL | |
| 27 | Inventory: lista SKUs con movimientos | ☐ PASS ☐ FAIL | |
| 28 | Purchases: órdenes de compra | ☐ PASS ☐ FAIL | |

---

## 5. Operations

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 29 | Fulfillment: lista órdenes pendientes | ☐ PASS ☐ FAIL | |
| 30 | Fulfillment: botón DESPACHAR cambia estado | ☐ PASS ☐ FAIL | |
| 31 | Shipping Rates: cotización devuelve tarifas | ☐ PASS ☐ FAIL | |
| 32 | Warehouse: inventario por ubicación | ☐ PASS ☐ FAIL | |
| 33 | Quality: tickets de soporte visibles | ☐ PASS ☐ FAIL | |
| 34 | Quality: devoluciones visibles | ☐ PASS ☐ FAIL | |

---

## 6. Analytics

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 35 | Sales: revenue + órdenes + ticket promedio | ☐ PASS ☐ FAIL | |
| 36 | Sales: gráfica por canal renderiza | ☐ PASS ☐ FAIL | |
| 37 | Inventory: valor total + SKUs críticos | ☐ PASS ☐ FAIL | |
| 38 | Customers: KPIs B2C + B2B | ☐ PASS ☐ FAIL | |

---

## 7. Settings

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 39 | Integrations: status correcto por integración | ☐ PASS ☐ FAIL | |
| 40 | Integrations: guardar API key funciona | ☐ PASS ☐ FAIL | |
| 41 | Users: LIVE badge muestra usuarios reales | ☐ PASS ☐ FAIL | |
| 42 | Users: cambio de rol via PATCH funciona | ☐ PASS ☐ FAIL | |
| 43 | Billing: muestra plan actual del tenant | ☐ PASS ☐ FAIL | |
| 44 | Profile: guarda datos personales | ☐ PASS ☐ FAIL | |
| 45 | Profile: guarda datos empresa | ☐ PASS ☐ FAIL | |
| 46 | Security: audit log muestra eventos | ☐ PASS ☐ FAIL | |
| 47 | Notifications: toggles guardan preferencias | ☐ PASS ☐ FAIL | |

---

## 8. Admin (solo atollom_admin)

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 48 | Admin/Tenants: lista todos los tenants | ☐ PASS ☐ FAIL | |
| 49 | Admin/Tenants: muestra plan y user count | ☐ PASS ☐ FAIL | |
| 50 | Admin/Logs: audit trail cross-tenant | ☐ PASS ☐ FAIL | |
| 51 | Usuario normal NO puede acceder a /admin | ☐ PASS ☐ FAIL | |

---

## 9. Samantha AI

| # | Pregunta | Respuesta coherente | Latencia <3s | Sin errores console |
|---|----------|---------------------|--------------|---------------------|
| 52 | "Hola, ¿cómo estás?" | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |
| 53 | "¿Cuántas órdenes tengo hoy?" | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |
| 54 | "Muéstrame el inventario" | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |
| 55 | "¿Cuál es mi producto más vendido?" | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |
| 56 | "Ayúdame a crear una cotización" | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |

---

## 10. Cross-cutting

| # | Test | Resultado | Notas |
|---|------|-----------|-------|
| 57 | Todos los badges LIVE/SANDBOX correctos | ☐ PASS ☐ FAIL | |
| 58 | Responsive en móvil (375px) — todas las páginas | ☐ PASS ☐ FAIL | |
| 59 | Responsive en tablet (768px) | ☐ PASS ☐ FAIL | |
| 60 | Sin errores 404 en recursos | ☐ PASS ☐ FAIL | |
| 61 | Sin errores de hidratación (hydration mismatch) | ☐ PASS ☐ FAIL | |
| 62 | Sin warnings de unmounted component | ☐ PASS ☐ FAIL | |
| 63 | RBAC: agente NO puede ver Settings/Admin | ☐ PASS ☐ FAIL | |
| 64 | Tenant isolation: no ve datos de otro tenant | ☐ PASS ☐ FAIL | |

---

## Resultados

| Métrica | Valor |
|---------|-------|
| Tests PASS | ___ / 64 |
| Tests FAIL | ___ / 64 |
| Lighthouse Score (desktop) | ___ / 100 |
| Lighthouse Score (móvil) | ___ / 100 |
| Bundle size (JS inicial) | ___ KB |
| Sentry errores detectados | ___ |
| Latencia API promedio | ___ ms |

---

## Issues Encontrados

| # | Página | Descripción | Severidad | Estado |
|---|--------|-------------|-----------|--------|
| 1 | | | Alta/Media/Baja | Abierto/Resuelto |
| 2 | | | | |
| 3 | | | | |

---

## Notas Adicionales

```
[Espacio para notas del tester]
```

---

*Generado: Mayo 2026 · KINEXIS v1.0.0-beta*
