# KINEXIS - Seguridad Nivel Bancario

**Versión**: 1.0  
**Fecha**: 2026-04-20  
**Responsable**: Carlos Cortés (Atollom Labs)  
**Objetivo**: Protección de datos sensibles de clientes (nivel financiero)

---

## 1. Resumen Ejecutivo

KINEXIS maneja datos críticos:
- RFC y datos fiscales (CFDI)
- Información bancaria (CxC, CxP)
- Datos de clientes finales
- Credenciales de APIs (ML, Amazon, WhatsApp)

**Estándar objetivo**: Nivel bancario (equiparable a instituciones financieras mexicanas)

---

## 2. Encriptación

### 2.1 Encriptación en Reposo (At Rest)

**Base de datos (Supabase PostgreSQL)**:
- Algoritmo: AES-256-GCM
- Managed by: Supabase (infraestructura AWS)
- Keys: Rotación automática cada 90 días
- Backups: Encriptados con misma clave

**Archivos (Supabase Storage)**:
- Algoritmo: AES-256
- Scope: PDFs factura, imágenes productos, documentos adjuntos
- Buckets: Separados por tenant (isolación física)

**Secrets (Variables de entorno)**:
- Railway: Encriptación nativa en vault
- Vercel: Encrypted environment variables
- Nunca en código fuente
- Rotación: Manual trimestral (automatizar en Q2)

### 2.2 Encriptación en Tránsito (In Transit)

**Todos los endpoints**:
- Protocolo: TLS 1.3
- Certificados: Let's Encrypt (auto-renovación)
- HSTS: Strict-Transport-Security header (max-age=31536000)
- No HTTP: Todas las conexiones forzadas a HTTPS

**APIs externas**:
- Mercado Libre: OAuth 2.0 + HTTPS
- Amazon MWS: Signed requests + HTTPS
- Shopify: Token auth + HTTPS
- WhatsApp: Meta Cloud API + HTTPS
- FacturAPI: API Key + HTTPS

### 2.3 Encriptación de Contraseñas

**Usuarios (Supabase Auth)**:
- Algoritmo: bcrypt (cost factor 10)
- Nunca almacenadas en texto plano
- Reset password: Token temporal (1 hora expiración)

**2FA (Opcional)**:
- Método: TOTP (Time-based One-Time Password)
- Librería: Supabase built-in
- Backup codes: Encriptados en BD

---

## 3. Autenticación y Autorización

### 3.1 Autenticación (Auth)

**JWT Tokens**:
- Firma: HMAC SHA-256
- Payload: user_id, tenant_id, role, exp
- Expiración: 1 hora (access token)
- Refresh token: httpOnly cookie, 30 días

**Flujo de login**:
```
1. Usuario: email + password
2. Supabase: Valida credenciales
3. Si válido: Genera access_token (1h) + refresh_token (30d)
4. Frontend: Guarda access_token en memoria (no localStorage)
5. Frontend: Guarda refresh_token en httpOnly cookie
6. Cada request: Authorization: Bearer {access_token}
7. Si access_token expira: Auto-refresh con refresh_token
```

**Login fallidos**:
- 5 intentos → CAPTCHA obligatorio
- 10 intentos → Bloqueo temporal 15 min
- 20 intentos → Bloqueo permanente + alerta admin

### 3.2 Autorización (RBAC + RLS)

**5 Roles definidos**:

| Rol | Permisos |
|-----|----------|
| owner | Acceso total (incluye billing, usuarios, config) |
| admin | Todo excepto billing |
| agente | CRM completo, E-commerce (readonly), ERP negado |
| almacenista | E-commerce completo, ERP Inventario, CRM (readonly) |
| contador | ERP completo, E-commerce (readonly), CRM (readonly) |

**Row Level Security (RLS)**:
```sql
-- Todas las tablas tienen esta policy base
CREATE POLICY "Tenant isolation"
ON {table_name}
FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::text);

-- Solo el dueño puede modificar usuarios
CREATE POLICY "Only owner can manage users"
ON user_profiles
FOR UPDATE
USING (
  tenant_id = current_setting('app.tenant_id')::text
  AND 
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

**Middleware (Next.js)**:
```typescript
// Verificación en cada request
export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')
  const { user, role } = await verifyToken(token)
  
  // Validar permisos por ruta
  if (request.url.includes('/erp/cfdi') && role !== 'owner' && role !== 'contador') {
    return new Response('Unauthorized', { status: 403 })
  }
  
  return NextResponse.next()
}
```

---

## 4. Protección de Infraestructura

### 4.1 DDoS Protection

**Cloudflare (Frontend)**:
- WAF (Web Application Firewall)
- Rate limiting: 100 req/min por IP
- Bot detection automático
- Cache CDN global

**Railway (Backend)**:
- Rate limiting: 200 req/min por tenant
- IP allowlist para endpoints críticos (`/api/admin/*`)
- Auto-scaling si carga >80%

### 4.2 Firewall y Network Security

**Railway Network**:
- Private networking entre servicios
- Solo puertos necesarios expuestos (443 HTTPS)
- No SSH directo (solo vía Railway CLI autenticado)

**Supabase Network**:
- Connection pooling (Supavisor)
- IP allowlist para conexiones admin
- SSL/TLS obligatorio

**Recomendación futura (>50 clientes)**:
- VPN privada entre Railway y Supabase
- Firewall rules específicas por IP origen

### 4.3 Prevención de Ataques Comunes

**SQL Injection**:
- ✅ Supabase: Prepared statements (Prisma ORM)
- ✅ Validación input en frontend + backend
- ✅ RLS policies en BD

**XSS (Cross-Site Scripting)**:
- ✅ React auto-escaping
- ✅ CSP headers:
  ```
  Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.vercel-analytics.com;
    style-src 'self' 'unsafe-inline';
  ```
- ✅ Sanitización de inputs HTML (DOMPurify)

**CSRF (Cross-Site Request Forgery)**:
- ✅ SameSite cookies
- ✅ CSRF tokens en formularios críticos
- ✅ Referer validation

**Clickjacking**:
- ✅ X-Frame-Options: DENY
- ✅ Frame-ancestors: 'none' (CSP)

---

## 5. Monitoreo y Auditoría

### 5.1 Audit Logs

**Eventos registrados**:
- Todos los logins (éxito/fallo)
- Cambios en datos críticos:
  - Facturas CFDI generadas
  - Cambios de precios
  - Usuarios creados/modificados/eliminados
  - Cambios de rol
- Acciones de Samantha:
  - ¿Quién pidió qué?
  - ¿Qué agentes se llamaron?
  - ¿Qué se ejecutó?
- Acceso a datos sensibles:
  - Consulta de RFC
  - Exportación de reportes
  - Descarga masiva de datos

**Estructura log**:
```json
{
  "id": "log-uuid-123",
  "timestamp": "2026-04-20T14:32:15.123Z",
  "tenant_id": "orthocardio",
  "user_id": "user-uuid-456",
  "user_email": "admin@orthocardio.com",
  "action": "cfdi.generate",
  "resource_type": "invoice",
  "resource_id": "F-2026-042",
  "ip_address": "187.142.85.23",
  "user_agent": "Mozilla/5.0...",
  "success": true,
  "details": {
    "rfc": "XAXX010101000",
    "amount": 5280.00,
    "uuid": "A1B2C3D4-E5F6..."
  }
}
```

**Retención**:
- 90 días: PostgreSQL (acceso rápido)
- 1 año: S3 Glacier (cold storage, compliance)
- 1 año: Backup offline encriptado

### 5.2 Monitoreo en Tiempo Real

**Sentry (Error Tracking)**:
- Errores JavaScript (frontend)
- Excepciones Python/Node (backend)
- Performance monitoring
- Alertas a Slack si:
  - >10 errores/min
  - Error crítico (payment, facturación)

**PostHog (Analytics)**:
- Uso de features
- Flujos de usuario
- Anomalías de comportamiento
- GDPR-compliant (EU hosting)

**Railway Logs**:
- Logs en tiempo real
- Alertas si CPU >90% o RAM >85%
- Crash detection automático

### 5.3 Alertas de Seguridad

**Triggers automáticos**:

⚠️ 10 logins fallidos en 5 min  
→ Alerta a admin + CAPTCHA obligatorio

⚠️ Cambio de rol a 'owner' por alguien que no es owner  
→ Alerta + rollback automático

⚠️ Acceso desde nueva IP/país no visto antes  
→ Email verificación + MFA obligatorio

⚠️ Descarga masiva de datos (>1000 registros)  
→ Alerta a owner + require confirmación

⚠️ Spike de tráfico (>300% vs promedio)  
→ DDoS mitigation automático

---

## 6. Backup y Recuperación

### 6.1 Backup de Base de Datos

**Supabase (Automático)**:
- Frecuencia: Diario (3 AM UTC)
- Retención: 7 días (point-in-time recovery)
- Tipo: Incremental (solo cambios)
- Ubicación: AWS S3 (multi-region)
- Encriptación: AES-256

**Backup manual (Crítico)**:
- Frecuencia: Semanal (domingos)
- Scope: Dump completo PostgreSQL
- Ubicación: Railway persistent volume + S3
- Prueba de restauración: Mensual

### 6.2 Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 horas  
**RPO (Recovery Point Objective)**: 24 horas máximo

**Escenarios**:

| Escenario | Procedimiento | Tiempo Estimado |
|-----------|--------------|-----------------|
| BD corrupta | Restore desde backup diario | 1-2 horas |
| Railway down | Failover a backup Railway | 30 min - 1 hora |
| Vercel down | Cloudflare cached pages | 0 min (auto) |
| Supabase down | Backup PostgreSQL en Railway | 2-4 horas |

Plan de contingencia completo: `docs/DR_PLAN.md` (crear en Fase 2)

---

## 7. Compliance y Certificaciones

### 7.1 México

**CFDI 4.0 (SAT)**:
- ✅ Formato XML validado
- ✅ Timbrado FacturAPI certificado
- ✅ Cancelación conforme a reglas SAT
- ✅ Addendas si el cliente las requiere

**Ley Federal de Protección de Datos Personales (LFPDPPP)**:
- ✅ Aviso de privacidad publicado
- ✅ Consentimiento explícito para usar datos
- ✅ Derecho ARCO (Acceso, Rectificación, Cancelación, Oposición)
- ✅ Datos sensibles encriptados

**Facturación Electrónica Obligatoria**:
- ✅ Todas las ventas >$2,000 se facturan automático
- ✅ Almacenamiento XML 5 años (compliance SAT)

### 7.2 Internacional

**GDPR (Europa)**:
- ⬜ Privacy by design (en proceso)
- ⬜ Right to be forgotten (delete account)
- ⬜ Data portability (export JSON)
- ⬜ Breach notification <72h

**CCPA (California)**:
- ⬜ Opt-out de venta de datos
- ⬜ Disclosure de datos recolectados

**SOC 2 Type II**:
- ⬜ En proceso (Q3 2026)
- ⬜ Auditoría externa (BDO México)
- ⬜ Controles: CIA (Confidentiality, Integrity, Availability)

---

## 8. Gestión de Vulnerabilidades

### 8.1 Actualizaciones de Seguridad

**Dependencias (npm/pip)**:
- Herramienta: Dependabot (GitHub)
- Frecuencia: Semanal
- Prioridad: Critical > High > Medium
- Proceso:
  1. Dependabot crea PR automático
  2. Tests CI/CD pasan
  3. Merge y deploy en <24h

**Stack base**:
- Node.js: Actualización cada 6 meses (LTS)
- Python: Actualización anual
- PostgreSQL: Minor updates automáticos, major cada 2 años

### 8.2 Pentesting y Auditorías

**Pentesting externo**:
- Frecuencia: Anual (o antes de cada ronda de inversión)
- Proveedor: Por contratar (sugerido: BDO, Deloitte MX)
- Scope: APIs, autenticación, RLS, encriptación

**Code review interno**:
- Frecuencia: Cada feature crítica
- Reviewers: 2 ingenieros (peer review)
- Checklist: OWASP Top 10

**Bug Bounty (Futuro Q4 2026)**:
- Plataforma: HackerOne
- Scope: Reporte vulnerabilidades
- Rewards: $100-$5,000 USD según severidad

---

## 9. Acceso y Gestión de Identidades

### 9.1 Acceso de Empleados Atollom

**Principio de menor privilegio**:
- Cada ingeniero solo accede a lo que necesita
- No hay credenciales compartidas
- Cuentas personales (no genéricas)

**Accesos actuales**:

| Persona | Railway | Supabase | Vercel | Secrets |
|---------|---------|----------|--------|---------|
| Carlos (Owner) | Admin | Owner | Owner | Todos |
| Ingeniero 1 | Viewer | Readonly | Viewer | Ninguno |
| Ingeniero 2 | Viewer | Readonly | Viewer | Ninguno |

**Rotación de accesos**:
- Al salir un ingeniero: Revocar en <1 hora
- Cambio de contraseñas críticas: Inmediato
- Auditoría trimestral de permisos

### 9.2 Acceso de Soporte a Datos de Clientes

**Política estricta**:
- ⛔ Ningún empleado Atollom accede datos de cliente sin autorización explícita
- ✅ Si cliente pide soporte: Ticket con consentimiento firmado
- ✅ Logs de acceso: Quién vio qué y cuándo
- ✅ Máscara de datos sensibles (RFC: XXX-XXXXXX-XX3)

**Procedimiento soporte**:
1. Cliente reporta bug/problema
2. Ingeniero crea ticket
3. Cliente firma consentimiento acceso
4. Ingeniero accede SOLO a ese tenant
5. Todos los queries logueados
6. Al terminar: Resumen enviado a cliente

---

## 10. Seguridad en Desarrollo

### 10.1 Secrets Management

**Nunca en código fuente**:
```bash
# ❌ MAL
const API_KEY = "sk_live_123abc"

# ✅ BIEN
const API_KEY = process.env.STRIPE_API_KEY
```

**Herramientas**:
- Railway: Encrypted env vars
- Vercel: Environment variables (per environment)
- Local dev: `.env.local` (gitignored)

**Rotación de secrets**:
- API keys externas: Cada 6 meses
- JWT secret: Anual
- DB passwords: Managed by Supabase

### 10.2 CI/CD Security

**GitHub Actions**:
- Secrets en GitHub Secrets (encriptados)
- Workflow requiere code review aprobado
- No auto-merge en main sin tests

**Pre-commit hooks**:
- Linter de secrets (detect-secrets)
- Tests de seguridad (npm audit, pip-audit)
- Formatting (Prettier, Black)

---

## 11. Respuesta a Incidentes

### 11.1 Plan de Respuesta

**Fase 1: Detección (0-15 min)**:
- Alerta automática (Sentry/monitoring)
- Ingeniero on-call notificado
- Evaluación severidad (Critical/High/Medium/Low)

**Fase 2: Contención (15-60 min)**:
- Si brecha de seguridad: Aislar sistema afectado
- Revocar credenciales comprometidas
- Activar backup si necesario

**Fase 3: Erradicación (1-4 horas)**:
- Patch de vulnerabilidad
- Restore desde backup limpio
- Cambio de todas las credenciales relacionadas

**Fase 4: Recuperación (4-24 horas)**:
- Deploy de fix
- Monitoreo intensivo 48h
- Comunicación a clientes afectados

**Fase 5: Post-Mortem (1 semana)**:
- Documento de análisis
- Identificar root cause
- Implementar prevenciones

### 11.2 Comunicación de Brechas

**Obligación legal (LFPDPPP)**:
- Notificar a clientes en <72 horas
- Notificar a INAI (Instituto Nacional de Transparencia)

**Plantilla comunicación**:
```
Asunto: Notificación de Incidente de Seguridad

Estimado cliente,

El [fecha], detectamos un incidente de seguridad que pudo haber 
afectado [datos específicos]. 

Acciones tomadas:
- [Lista de acciones]

Datos comprometidos:
- [Detalle específico]

Recomendaciones:
- [Cambio de contraseña, etc.]

Contacto: seguridad@atollom.com
```

---

## 12. Roadmap de Seguridad

**Fase 1: ACTUAL (Abril 2026) ✅**
- ✅ Encriptación at rest/in transit
- ✅ RBAC + RLS
- ✅ Audit logs básicos
- ✅ Backup diario
- ✅ CFDI compliance

**Fase 2: Q2 2026 (Mayo-Junio)**
- ⬜ 2FA obligatorio para owners
- ⬜ IP allowlist configurable
- ⬜ Pentesting externo
- ⬜ Disaster recovery drill
- ⬜ SOC 2 preparación

**Fase 3: Q3 2026 (Julio-Septiembre)**
- ⬜ Bug bounty program
- ⬜ SIEM (Security Information and Event Management)
- ⬜ SOC 2 Type II certificación
- ⬜ WAF custom rules

**Fase 4: Q4 2026 (Octubre-Diciembre)**
- ⬜ Zero-trust architecture
- ⬜ Hardware security keys (YubiKey)
- ⬜ Automated threat detection (AI)
- ⬜ ISO 27001 preparación

---

## 13. Responsables

| Rol | Nombre | Estado |
|-----|--------|--------|
| CISO (Chief Information Security Officer) | Carlos Cortés (interim) | Activo |
| Security Team | — | Por contratar (Q2 2026) |
| Compliance Officer | — | Por contratar (Q3 2026) |

**Contacto seguridad**: seguridad@atollom.com  
**Reporte de vulnerabilidades**: security@atollom.com

---

*Última actualización: 20 abril 2026*  
*Versión: 1.0*

---

**Firmado digitalmente**:  
Responsable: Carlos Cortés  
Email:       contacto@atollom.com  
Empresa:     Atollom Labs S. de R.L. de C.V.  

*Copyright © 2026 Atollom Labs. Todos los derechos reservados.*
