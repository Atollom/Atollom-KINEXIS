// Centralized demo data — Kap Tools (tenant piloto)
// Used across CFDI, ERP, and E-commerce modules

// ── CFDI ──────────────────────────────────────────────────────────────────────

export interface CFDIFactura {
  id: number
  folio: string
  uuid: string
  serie: string
  fecha_emision: string
  receptor_nombre: string
  receptor_rfc: string
  subtotal: number
  iva: number
  total: number
  forma_pago: string
  metodo_pago: 'PUE' | 'PPD'
  status: 'vigente' | 'cancelada'
  timbrado: boolean
  complemento_pendiente?: boolean
}

export const CFDI_EMITIDAS: CFDIFactura[] = [
  {
    id: 1,
    folio: 'F-2026-047',
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    serie: 'F',
    fecha_emision: '2026-05-02T10:30:00Z',
    receptor_nombre: 'Constructora ABC S.A. de C.V.',
    receptor_rfc: 'CAB850101ABC',
    subtotal: 22_500,
    iva: 3_600,
    total: 26_100,
    forma_pago: '03 - Transferencia',
    metodo_pago: 'PUE',
    status: 'vigente',
    timbrado: true,
  },
  {
    id: 2,
    folio: 'F-2026-046',
    uuid: 'B2C3D4E5-F6A7-8901-BCDE-FG2345678901',
    serie: 'F',
    fecha_emision: '2026-05-01T15:45:00Z',
    receptor_nombre: 'Ferretería El Martillo S.A. de C.V.',
    receptor_rfc: 'FEM920301XYZ',
    subtotal: 18_750,
    iva: 3_000,
    total: 21_750,
    forma_pago: '04 - Tarjeta crédito',
    metodo_pago: 'PPD',
    status: 'vigente',
    timbrado: true,
    complemento_pendiente: true,
  },
  {
    id: 3,
    folio: 'F-2026-045',
    uuid: 'C3D4E5F6-G7H8-9012-CDEF-GH3456789012',
    serie: 'F',
    fecha_emision: '2026-04-30T09:00:00Z',
    receptor_nombre: 'Distribuidora Omega S.C.',
    receptor_rfc: 'DOM920301AB9',
    subtotal: 11_000,
    iva: 1_760,
    total: 12_760,
    forma_pago: '03 - Transferencia',
    metodo_pago: 'PUE',
    status: 'vigente',
    timbrado: true,
  },
  {
    id: 4,
    folio: 'F-2026-044',
    uuid: 'D4E5F6G7-H8I9-0123-DEFG-HI4567890123',
    serie: 'F',
    fecha_emision: '2026-04-28T14:20:00Z',
    receptor_nombre: 'Obra Civil Tlaxcala S.A. de C.V.',
    receptor_rfc: 'OCT880215JKL',
    subtotal: 31_200,
    iva: 4_992,
    total: 36_192,
    forma_pago: '03 - Transferencia',
    metodo_pago: 'PUE',
    status: 'vigente',
    timbrado: true,
  },
  {
    id: 5,
    folio: 'F-2026-043',
    uuid: 'E5F6G7H8-I9J0-1234-EFGH-IJ5678901234',
    serie: 'F',
    fecha_emision: '2026-04-25T11:15:00Z',
    receptor_nombre: 'Materiales Industriales del Sur',
    receptor_rfc: 'MIS910730MNO',
    subtotal: 8_400,
    iva: 1_344,
    total: 9_744,
    forma_pago: '01 - Efectivo',
    metodo_pago: 'PUE',
    status: 'cancelada',
    timbrado: true,
  },
  {
    id: 6,
    folio: 'F-2026-042',
    uuid: 'F6G7H8I9-J0K1-2345-FGHI-JK6789012345',
    serie: 'F',
    fecha_emision: '2026-04-22T16:00:00Z',
    receptor_nombre: 'Ferretería Central S.A. de C.V.',
    receptor_rfc: 'FER850101PQR',
    subtotal: 12_180,
    iva: 1_949,
    total: 14_129,
    forma_pago: '28 - Tarjeta débito',
    metodo_pago: 'PUE',
    status: 'vigente',
    timbrado: true,
  },
  {
    id: 7,
    folio: 'F-2026-041',
    uuid: 'G7H8I9J0-K1L2-3456-GHIJ-KL7890123456',
    serie: 'F',
    fecha_emision: '2026-04-20T10:00:00Z',
    receptor_nombre: 'Construcciones del Norte S.C.',
    receptor_rfc: 'CON840215STU',
    subtotal: 8_500,
    iva: 1_360,
    total: 9_860,
    forma_pago: '03 - Transferencia',
    metodo_pago: 'PPD',
    status: 'vigente',
    timbrado: true,
    complemento_pendiente: true,
  },
  {
    id: 8,
    folio: 'F-2026-040',
    uuid: 'H8I9J0K1-L2M3-4567-HIJK-LM8901234567',
    serie: 'F',
    fecha_emision: '2026-04-18T09:30:00Z',
    receptor_nombre: 'Grupo Herramienta Profesional',
    receptor_rfc: 'GHP970512VWX',
    subtotal: 45_000,
    iva: 7_200,
    total: 52_200,
    forma_pago: '03 - Transferencia',
    metodo_pago: 'PUE',
    status: 'vigente',
    timbrado: true,
  },
]

export interface CFDIRecibida {
  id: number
  folio: string
  uuid: string
  fecha_emision: string
  emisor_nombre: string
  emisor_rfc: string
  subtotal: number
  iva: number
  total: number
  status: 'vigente' | 'cancelada'
  pagada: boolean
  fecha_vencimiento: string
}

export const CFDI_RECIBIDAS: CFDIRecibida[] = [
  {
    id: 1,
    folio: 'PR-2026-078',
    uuid: 'R1A2B3C4-D5E6-7890-RABC-DE1234567890',
    fecha_emision: '2026-04-28T09:15:00Z',
    emisor_nombre: 'Proveedor Industrial del Norte S.A. de C.V.',
    emisor_rfc: 'PIN760801ABC',
    subtotal: 25_000,
    iva: 4_000,
    total: 29_000,
    status: 'vigente',
    pagada: true,
    fecha_vencimiento: '2026-05-15',
  },
  {
    id: 2,
    folio: 'PR-2026-077',
    uuid: 'R2B3C4D5-E6F7-8901-RBCD-EF2345678901',
    fecha_emision: '2026-04-25T14:00:00Z',
    emisor_nombre: 'Herramientas y Equipos Nacionales S.A.',
    emisor_rfc: 'HEN850212DEF',
    subtotal: 18_300,
    iva: 2_928,
    total: 21_228,
    status: 'vigente',
    pagada: false,
    fecha_vencimiento: '2026-05-10',
  },
  {
    id: 3,
    folio: 'PR-2026-076',
    uuid: 'R3C4D5E6-F7G8-9012-RCDE-FG3456789012',
    fecha_emision: '2026-04-20T10:30:00Z',
    emisor_nombre: 'Distribuidora de Herramientas Centro',
    emisor_rfc: 'DHC910530GHI',
    subtotal: 9_500,
    iva: 1_520,
    total: 11_020,
    status: 'vigente',
    pagada: true,
    fecha_vencimiento: '2026-05-05',
  },
  {
    id: 4,
    folio: 'PR-2026-075',
    uuid: 'R4D5E6F7-G8H9-0123-RDEF-GH4567890123',
    fecha_emision: '2026-04-18T08:00:00Z',
    emisor_nombre: 'Aceros y Materiales Industriales SA',
    emisor_rfc: 'AMI880918JKL',
    subtotal: 42_000,
    iva: 6_720,
    total: 48_720,
    status: 'vigente',
    pagada: false,
    fecha_vencimiento: '2026-05-03',
  },
  {
    id: 5,
    folio: 'PR-2026-074',
    uuid: 'R5E6F7G8-H9I0-1234-REFG-HI5678901234',
    fecha_emision: '2026-04-15T11:00:00Z',
    emisor_nombre: 'Logística Express Puebla S.C.',
    emisor_rfc: 'LEP940215MNO',
    subtotal: 3_800,
    iva: 608,
    total: 4_408,
    status: 'vigente',
    pagada: true,
    fecha_vencimiento: '2026-04-30',
  },
  {
    id: 6,
    folio: 'PR-2026-073',
    uuid: 'R6F7G8H9-I0J1-2345-RFGH-IJ6789012345',
    fecha_emision: '2026-04-10T09:00:00Z',
    emisor_nombre: 'Empaques y Logística del Centro',
    emisor_rfc: 'ELC870601PQR',
    subtotal: 6_200,
    iva: 992,
    total: 7_192,
    status: 'cancelada',
    pagada: false,
    fecha_vencimiento: '2026-04-25',
  },
]

export const CFDI_STATS = {
  emitidas: {
    total: 47,
    vigentes: 44,
    canceladas: 3,
    pue: 38,
    ppd: 9,
    monto_total: 587_450,
    iva_total: 79_960,
  },
  recibidas: {
    total: 28,
    pagadas: 22,
    pendientes: 5,
    vencidas: 1,
    monto_total: 342_100,
  },
  complementos: {
    total: 12,
    emitidos: 9,
    pendientes: 3,
    monto_cubierto: 145_600,
  },
  sat: {
    certificado_valido: true,
    vigencia_certificado: '2027-03-15',
    sellos_disponibles: 8_547,
    sellos_usados_mes: 47,
    pac: 'FacturAPI',
    pac_latencia_ms: 42,
  },
}

// ── CRM INBOX ─────────────────────────────────────────────────────────────────

export interface InboxMessage {
  id: string
  conversation_id: string
  sender: 'customer' | 'agent' | 'bot'
  sender_name: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'image' | 'audio' | 'file'
}

export interface Conversation {
  id: string
  platform: 'whatsapp' | 'instagram' | 'facebook'
  customer: {
    name: string
    phone?: string
    username?: string
  }
  status: 'open' | 'pending' | 'resolved' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string | null
  tags: string[]
  last_message: string
  last_message_at: string
  unread_count: number
  messages: InboxMessage[]
}

export const mockConversations: Conversation[] = [
  // ── WhatsApp ─────────────────────────────────────────────
  {
    id: 'wa-001',
    platform: 'whatsapp',
    customer: { name: 'Carlos García', phone: '+52 222 123 4567' },
    status: 'open',
    priority: 'high',
    assigned_to: 'Samantha AI',
    tags: ['vip', 'pedido-pendiente'],
    last_message: '¿Cuándo llega mi pedido del taladro?',
    last_message_at: '2026-05-03T10:15:00Z',
    unread_count: 2,
    messages: [
      { id: 'wa001-1', conversation_id: 'wa-001', sender: 'customer', sender_name: 'Carlos García', content: 'Hola, hice un pedido hace 3 días del Taladro Percutor 800W.', timestamp: '2026-05-03T09:00:00Z', read: true, type: 'text' },
      { id: 'wa001-2', conversation_id: 'wa-001', sender: 'bot', sender_name: 'Samantha AI', content: 'Hola Carlos, déjame revisar tu pedido. ¿Me das tu número de orden?', timestamp: '2026-05-03T09:02:00Z', read: true, type: 'text' },
      { id: 'wa001-3', conversation_id: 'wa-001', sender: 'customer', sender_name: 'Carlos García', content: 'ML-45892', timestamp: '2026-05-03T09:05:00Z', read: true, type: 'text' },
      { id: 'wa001-4', conversation_id: 'wa-001', sender: 'bot', sender_name: 'Samantha AI', content: 'Perfecto Carlos. Tu pedido ML-45892 (Taladro Percutor 800W × 2) está en camino. Guía: FX123456789MX. Llegará el lunes 5 de mayo.', timestamp: '2026-05-03T09:07:00Z', read: true, type: 'text' },
      { id: 'wa001-5', conversation_id: 'wa-001', sender: 'customer', sender_name: 'Carlos García', content: '¿Cuándo llega mi pedido del taladro?', timestamp: '2026-05-03T10:15:00Z', read: false, type: 'text' },
      { id: 'wa001-6', conversation_id: 'wa-001', sender: 'bot', sender_name: 'Samantha AI', content: 'Como te comenté antes, llega el lunes 5 de mayo. Puedes rastrear tu paquete con la guía FX123456789MX en la paquetería.', timestamp: '2026-05-03T10:16:00Z', read: false, type: 'text' },
    ],
  },
  {
    id: 'wa-002',
    platform: 'whatsapp',
    customer: { name: 'María López', phone: '+52 222 987 6543' },
    status: 'pending',
    priority: 'urgent',
    assigned_to: null,
    tags: ['cotización', 'volumen'],
    last_message: 'Necesito 100 taladros para el lunes',
    last_message_at: '2026-05-03T11:30:00Z',
    unread_count: 1,
    messages: [
      { id: 'wa002-1', conversation_id: 'wa-002', sender: 'customer', sender_name: 'María López', content: 'Buenos días, necesito cotización urgente para mi empresa.', timestamp: '2026-05-03T11:25:00Z', read: true, type: 'text' },
      { id: 'wa002-2', conversation_id: 'wa-002', sender: 'customer', sender_name: 'María López', content: 'Necesito 100 taladros para el lunes, ¿es posible?', timestamp: '2026-05-03T11:30:00Z', read: false, type: 'text' },
    ],
  },
  {
    id: 'wa-003',
    platform: 'whatsapp',
    customer: { name: 'Roberto Herrera', phone: '+52 442 555 8899' },
    status: 'open',
    priority: 'medium',
    assigned_to: 'Samantha AI',
    tags: ['seguimiento'],
    last_message: 'Perfecto, espero la confirmación',
    last_message_at: '2026-05-03T09:40:00Z',
    unread_count: 0,
    messages: [
      { id: 'wa003-1', conversation_id: 'wa-003', sender: 'customer', sender_name: 'Roberto Herrera', content: 'Buen día, quiero saber el estado de mi pedido KAP-2026-089', timestamp: '2026-05-03T09:30:00Z', read: true, type: 'text' },
      { id: 'wa003-2', conversation_id: 'wa-003', sender: 'bot', sender_name: 'Samantha AI', content: 'Hola Roberto, tu pedido KAP-2026-089 ya fue surtido y está listo para recolección en almacén. ¿Prefieres envío o recolección en sucursal?', timestamp: '2026-05-03T09:35:00Z', read: true, type: 'text' },
      { id: 'wa003-3', conversation_id: 'wa-003', sender: 'customer', sender_name: 'Roberto Herrera', content: 'Envío por favor, a la misma dirección de siempre.', timestamp: '2026-05-03T09:38:00Z', read: true, type: 'text' },
      { id: 'wa003-4', conversation_id: 'wa-003', sender: 'bot', sender_name: 'Samantha AI', content: 'Listo, procesando envío a Blvd. Hermanos Serdán 100, Puebla. Te llega la guía en 30 minutos.', timestamp: '2026-05-03T09:39:00Z', read: true, type: 'text' },
      { id: 'wa003-5', conversation_id: 'wa-003', sender: 'customer', sender_name: 'Roberto Herrera', content: 'Perfecto, espero la confirmación', timestamp: '2026-05-03T09:40:00Z', read: true, type: 'text' },
    ],
  },
  {
    id: 'wa-004',
    platform: 'whatsapp',
    customer: { name: 'Constructora ABC', phone: '+52 222 100 2000' },
    status: 'open',
    priority: 'low',
    assigned_to: 'Samantha AI',
    tags: ['cliente-mensual', 'vip'],
    last_message: 'El pedido de brocas del mes',
    last_message_at: '2026-05-02T16:00:00Z',
    unread_count: 0,
    messages: [
      { id: 'wa004-1', conversation_id: 'wa-004', sender: 'customer', sender_name: 'Constructora ABC', content: 'Hola Kap Tools, les mando el pedido de brocas del mes: SET-BRO-002 × 20 juegos.', timestamp: '2026-05-02T16:00:00Z', read: true, type: 'text' },
      { id: 'wa004-2', conversation_id: 'wa-004', sender: 'bot', sender_name: 'Samantha AI', content: 'Perfecto, recibido. 20 juegos SET-BRO-002 — total: $7,400 MXN + IVA. Generando orden de compra y CFDI automático. ¿Confirmamos?', timestamp: '2026-05-02T16:05:00Z', read: true, type: 'text' },
    ],
  },
  {
    id: 'wa-005',
    platform: 'whatsapp',
    customer: { name: 'Ferretería El Martillo', phone: '+52 222 300 4500' },
    status: 'pending',
    priority: 'high',
    assigned_to: null,
    tags: ['queja', 'garantía'],
    last_message: 'Las brocas llegaron defectuosas, necesito reposición',
    last_message_at: '2026-05-03T08:20:00Z',
    unread_count: 3,
    messages: [
      { id: 'wa005-1', conversation_id: 'wa-005', sender: 'customer', sender_name: 'Ferretería El Martillo', content: 'Buenos días, tenemos un problema con el pedido F-2026-046.', timestamp: '2026-05-03T08:10:00Z', read: true, type: 'text' },
      { id: 'wa005-2', conversation_id: 'wa-005', sender: 'customer', sender_name: 'Ferretería El Martillo', content: 'Las brocas llegaron defectuosas, necesito reposición urgente.', timestamp: '2026-05-03T08:20:00Z', read: false, type: 'text' },
      { id: 'wa005-3', conversation_id: 'wa-005', sender: 'customer', sender_name: 'Ferretería El Martillo', content: '¿Pueden llamarme hoy?', timestamp: '2026-05-03T08:21:00Z', read: false, type: 'text' },
      { id: 'wa005-4', conversation_id: 'wa-005', sender: 'customer', sender_name: 'Ferretería El Martillo', content: 'Es urgente, tenemos obra mañana', timestamp: '2026-05-03T08:22:00Z', read: false, type: 'text' },
    ],
  },

  // ── Instagram ─────────────────────────────────────────────
  {
    id: 'ig-001',
    platform: 'instagram',
    customer: { name: '@ferreteria_moderna', username: 'ferreteria_moderna' },
    status: 'open',
    priority: 'medium',
    assigned_to: 'Samantha AI',
    tags: ['prospecto'],
    last_message: '¿Tienen envíos a Guadalajara?',
    last_message_at: '2026-05-03T08:45:00Z',
    unread_count: 1,
    messages: [
      { id: 'ig001-1', conversation_id: 'ig-001', sender: 'customer', sender_name: '@ferreteria_moderna', content: 'Hola! Vi su publicación del compresor 25L, ¿qué precio tiene?', timestamp: '2026-05-03T08:30:00Z', read: true, type: 'text' },
      { id: 'ig001-2', conversation_id: 'ig-001', sender: 'bot', sender_name: 'Samantha AI', content: 'Hola! El Compresor 25L 2HP está en $3,890 MXN. Tenemos en stock. ¿Te interesa?', timestamp: '2026-05-03T08:32:00Z', read: true, type: 'text' },
      { id: 'ig001-3', conversation_id: 'ig-001', sender: 'customer', sender_name: '@ferreteria_moderna', content: '¿Tienen envíos a Guadalajara?', timestamp: '2026-05-03T08:45:00Z', read: false, type: 'text' },
    ],
  },
  {
    id: 'ig-002',
    platform: 'instagram',
    customer: { name: '@taller_mecanico_mx', username: 'taller_mecanico_mx' },
    status: 'open',
    priority: 'high',
    assigned_to: 'Samantha AI',
    tags: ['prospecto', 'taller'],
    last_message: 'Necesito 3 unidades para mi taller',
    last_message_at: '2026-05-03T10:50:00Z',
    unread_count: 2,
    messages: [
      { id: 'ig002-1', conversation_id: 'ig-002', sender: 'customer', sender_name: '@taller_mecanico_mx', content: 'Buenas, vi su post del taladro de banco. ¿Tienen más modelos?', timestamp: '2026-05-03T10:30:00Z', read: true, type: 'text' },
      { id: 'ig002-2', conversation_id: 'ig-002', sender: 'bot', sender_name: 'Samantha AI', content: 'Claro! Tenemos 3 modelos de taladro de banco: TB-350W (entrada), TB-600W (semiprofesional) y TB-900W (profesional). ¿Para qué uso lo necesitas?', timestamp: '2026-05-03T10:33:00Z', read: true, type: 'text' },
      { id: 'ig002-3', conversation_id: 'ig-002', sender: 'customer', sender_name: '@taller_mecanico_mx', content: 'Para taller automotriz, metales duros principalmente', timestamp: '2026-05-03T10:45:00Z', read: false, type: 'text' },
      { id: 'ig002-4', conversation_id: 'ig-002', sender: 'customer', sender_name: '@taller_mecanico_mx', content: 'Necesito 3 unidades para mi taller', timestamp: '2026-05-03T10:50:00Z', read: false, type: 'text' },
    ],
  },
  {
    id: 'ig-003',
    platform: 'instagram',
    customer: { name: '@obra_norte_mex', username: 'obra_norte_mex' },
    status: 'resolved',
    priority: 'low',
    assigned_to: 'Samantha AI',
    tags: ['catálogo'],
    last_message: 'Recibí el catálogo, muchas gracias',
    last_message_at: '2026-05-02T12:00:00Z',
    unread_count: 0,
    messages: [
      { id: 'ig003-1', conversation_id: 'ig-003', sender: 'customer', sender_name: '@obra_norte_mex', content: '¿Pueden mandarme su catálogo completo?', timestamp: '2026-05-02T11:45:00Z', read: true, type: 'text' },
      { id: 'ig003-2', conversation_id: 'ig-003', sender: 'bot', sender_name: 'Samantha AI', content: 'Claro, te envío el catálogo 2026 por DM ahora mismo. También puedes verlo en nuestro sitio: kaptools.mx/catalogo', timestamp: '2026-05-02T11:47:00Z', read: true, type: 'text' },
      { id: 'ig003-3', conversation_id: 'ig-003', sender: 'customer', sender_name: '@obra_norte_mex', content: 'Recibí el catálogo, muchas gracias', timestamp: '2026-05-02T12:00:00Z', read: true, type: 'text' },
    ],
  },
  {
    id: 'ig-004',
    platform: 'instagram',
    customer: { name: '@distribuidora_pro', username: 'distribuidora_pro' },
    status: 'pending',
    priority: 'urgent',
    assigned_to: null,
    tags: ['distribuidor', 'volumen'],
    last_message: 'Somos distribuidores, ¿tienen precios mayoreo?',
    last_message_at: '2026-05-03T11:55:00Z',
    unread_count: 4,
    messages: [
      { id: 'ig004-1', conversation_id: 'ig-004', sender: 'customer', sender_name: '@distribuidora_pro', content: 'Hola! Somos distribuidores en Monterrey con 15 puntos de venta.', timestamp: '2026-05-03T11:45:00Z', read: true, type: 'text' },
      { id: 'ig004-2', conversation_id: 'ig-004', sender: 'customer', sender_name: '@distribuidora_pro', content: 'Somos distribuidores, ¿tienen precios mayoreo?', timestamp: '2026-05-03T11:55:00Z', read: false, type: 'text' },
      { id: 'ig004-3', conversation_id: 'ig-004', sender: 'customer', sender_name: '@distribuidora_pro', content: 'Manejamos volúmenes de 200-500 piezas mensuales', timestamp: '2026-05-03T11:56:00Z', read: false, type: 'text' },
      { id: 'ig004-4', conversation_id: 'ig-004', sender: 'customer', sender_name: '@distribuidora_pro', content: 'Necesito hablar con el área comercial', timestamp: '2026-05-03T11:57:00Z', read: false, type: 'text' },
      { id: 'ig004-5', conversation_id: 'ig-004', sender: 'customer', sender_name: '@distribuidora_pro', content: '¿Me pueden contactar hoy?', timestamp: '2026-05-03T11:58:00Z', read: false, type: 'text' },
    ],
  },

  // ── Facebook ─────────────────────────────────────────────
  {
    id: 'fb-001',
    platform: 'facebook',
    customer: { name: 'Pedro Ramírez', username: 'pedro.ramirez.123' },
    status: 'resolved',
    priority: 'low',
    assigned_to: 'Samantha AI',
    tags: ['soporte', 'resuelto'],
    last_message: 'Muchas gracias, ya funcionó!',
    last_message_at: '2026-05-02T16:20:00Z',
    unread_count: 0,
    messages: [
      { id: 'fb001-1', conversation_id: 'fb-001', sender: 'customer', sender_name: 'Pedro Ramírez', content: 'El taladro que compré no enciende, lo revisé y está bien conectado.', timestamp: '2026-05-02T15:00:00Z', read: true, type: 'text' },
      { id: 'fb001-2', conversation_id: 'fb-001', sender: 'bot', sender_name: 'Samantha AI', content: '¿Ya verificaste que el switch lateral esté en posición ON? También revisa el fusible de protección que está en la base del mango.', timestamp: '2026-05-02T15:05:00Z', read: true, type: 'text' },
      { id: 'fb001-3', conversation_id: 'fb-001', sender: 'customer', sender_name: 'Pedro Ramírez', content: 'Era el fusible! Ya lo cambié y funciona perfecto', timestamp: '2026-05-02T16:15:00Z', read: true, type: 'text' },
      { id: 'fb001-4', conversation_id: 'fb-001', sender: 'customer', sender_name: 'Pedro Ramírez', content: 'Muchas gracias, ya funcionó!', timestamp: '2026-05-02T16:20:00Z', read: true, type: 'text' },
    ],
  },
  {
    id: 'fb-002',
    platform: 'facebook',
    customer: { name: 'Ana Silva', username: 'ana.silva.puebla' },
    status: 'pending',
    priority: 'medium',
    assigned_to: null,
    tags: ['garantía', 'soporte'],
    last_message: '¿Cómo proceso la garantía?',
    last_message_at: '2026-05-03T07:50:00Z',
    unread_count: 1,
    messages: [
      { id: 'fb002-1', conversation_id: 'fb-002', sender: 'customer', sender_name: 'Ana Silva', content: 'Buenos días, compré un compresor hace 6 meses y tiene una fuga de aire.', timestamp: '2026-05-03T07:40:00Z', read: true, type: 'text' },
      { id: 'fb002-2', conversation_id: 'fb-002', sender: 'customer', sender_name: 'Ana Silva', content: '¿Cómo proceso la garantía?', timestamp: '2026-05-03T07:50:00Z', read: false, type: 'text' },
    ],
  },
  {
    id: 'fb-003',
    platform: 'facebook',
    customer: { name: 'Industrias del Norte', username: 'industrias.norte.official' },
    status: 'open',
    priority: 'low',
    assigned_to: 'Samantha AI',
    tags: ['visita', 'prospecto'],
    last_message: '¿Tienen showroom en Puebla?',
    last_message_at: '2026-05-02T14:30:00Z',
    unread_count: 0,
    messages: [
      { id: 'fb003-1', conversation_id: 'fb-003', sender: 'customer', sender_name: 'Industrias del Norte', content: 'Hola, queremos conocer su catálogo de herramientas industriales. ¿Tienen showroom en Puebla?', timestamp: '2026-05-02T14:30:00Z', read: true, type: 'text' },
      { id: 'fb003-2', conversation_id: 'fb-003', sender: 'bot', sender_name: 'Samantha AI', content: 'Bienvenidos! Sí, tenemos showroom en Blvd. Hermanos Serdán 100, Puebla. Horario: Lun-Vie 9am-6pm. ¿Les gustaría agendar una visita con asesor?', timestamp: '2026-05-02T14:35:00Z', read: true, type: 'text' },
    ],
  },
]

export const mockInboxStats = {
  total_conversations: 47,
  open: 12,
  pending: 8,
  resolved: 23,
  archived: 4,
  by_platform: {
    whatsapp: 28,
    instagram: 12,
    facebook: 7,
  },
  avg_response_time: '4 min',
  resolution_rate: 89,
  satisfaction_score: 4.7,
}

// ─────────────────────────────────────────────────────────────────────────────
// MERCADO LIBRE
// ─────────────────────────────────────────────────────────────────────────────

export interface MLProduct {
  id: string
  sku: string
  ml_id: string
  title: string
  category: string
  price: number
  available_quantity: number
  sold_quantity: number
  status: 'active' | 'paused' | 'closed'
  listing_type: 'gold_special' | 'gold_pro' | 'free'
  condition: 'new' | 'used'
  permalink: string
  last_sync: string
}

export interface MLOrderItem {
  id: string
  title: string
  sku: string
  quantity: number
  unit_price: number
}

export interface MLOrder {
  id: string
  order_id: string
  date_created: string
  status: 'confirmed' | 'payment_required' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  buyer_nickname: string
  buyer_phone: string
  items: MLOrderItem[]
  total_amount: number
  shipping_type: 'mercado_envios' | 'self_service'
  shipping_status: 'pending' | 'handling' | 'ready_to_ship' | 'shipped' | 'delivered'
  tracking_number: string | null
  payment_type: string
  payment_status: 'pending' | 'approved' | 'rejected'
}

export interface MLQuestion {
  id: string
  question: string
  answer?: string
  status: 'unanswered' | 'answered'
  date_created: string
  item_id: string
  item_title: string
  item_sku: string
  from_nickname: string
}

export const mockMLProducts: MLProduct[] = [
  { id:'1',  sku:'TAL-003', ml_id:'MLM-2001345', title:'Taladro Percutor 850W Profesional', category:'Taladros',          price:1540,  available_quantity:8,  sold_quantity:234, status:'active', listing_type:'gold_special', condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001345', last_sync:'2026-05-10T14:30:00Z' },
  { id:'2',  sku:'TAL-001', ml_id:'MLM-2001346', title:'Taladro Inalámbrico 20V 2 Baterías', category:'Taladros',         price:2890,  available_quantity:14, sold_quantity:156, status:'active', listing_type:'gold_special', condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001346', last_sync:'2026-05-10T14:25:00Z' },
  { id:'3',  sku:'KAP-007', ml_id:'MLM-2001347', title:'Compresor de Aire 25L 2HP',         category:'Compresores',       price:3299,  available_quantity:45, sold_quantity:89,  status:'active', listing_type:'gold_pro',   condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001347', last_sync:'2026-05-10T14:20:00Z' },
  { id:'4',  sku:'KAP-011', ml_id:'MLM-2001348', title:'Llave de Impacto Neumática 1/2"',   category:'Neumática',         price:1180,  available_quantity:22, sold_quantity:145, status:'active', listing_type:'gold_special', condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001348', last_sync:'2026-05-10T14:15:00Z' },
  { id:'5',  sku:'BRO-002', ml_id:'MLM-2001349', title:'Set Brocas Multicombinación 29 pzs',category:'Accesorios',        price:420,   available_quantity:62, sold_quantity:347, status:'active', listing_type:'free',        condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001349', last_sync:'2026-05-10T14:10:00Z' },
  { id:'6',  sku:'BRO-015', ml_id:'MLM-2001350', title:'Broca Diamantada p/Concreto 100mm', category:'Accesorios',        price:340,   available_quantity:9,  sold_quantity:42,  status:'active', listing_type:'free',        condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001350', last_sync:'2026-05-10T14:05:00Z' },
  { id:'7',  sku:'NIV-004', ml_id:'MLM-2001351', title:'Nivel Láser 360° Automático Verde',  category:'Medición',         price:1890,  available_quantity:17, sold_quantity:56,  status:'active', listing_type:'gold_pro',   condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001351', last_sync:'2026-05-10T14:00:00Z' },
  { id:'8',  sku:'TAL-008', ml_id:'MLM-2001352', title:'Taladro de Columna Bancada 350W',   category:'Taladros',          price:5400,  available_quantity:3,  sold_quantity:28,  status:'active', listing_type:'gold_pro',   condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001352', last_sync:'2026-05-10T13:50:00Z' },
  { id:'9',  sku:'CAL-001', ml_id:'MLM-2001353', title:'Calibrador Vernier Digital 0-150mm', category:'Medición',         price:299,   available_quantity:88, sold_quantity:234, status:'active', listing_type:'free',        condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001353', last_sync:'2026-05-10T13:45:00Z' },
  { id:'10', sku:'ARN-002', ml_id:'MLM-2001354', title:'Arnés de Seguridad Industrial 3 Pts',category:'EPP',              price:680,   available_quantity:31, sold_quantity:67,  status:'active', listing_type:'free',        condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001354', last_sync:'2026-05-10T13:40:00Z' },
  { id:'11', sku:'SIE-002', ml_id:'MLM-2001355', title:'Sierra Circular 1400W + Guía',       category:'Corte',            price:1899,  available_quantity:0,  sold_quantity:78,  status:'paused', listing_type:'gold_special', condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001355', last_sync:'2026-05-09T10:00:00Z' },
  { id:'12', sku:'TAL-010', ml_id:'MLM-2001356', title:'Taladro SDS Plus 800W Martillo',     category:'Taladros',         price:2450,  available_quantity:11, sold_quantity:91,  status:'active', listing_type:'gold_special', condition:'new', permalink:'https://articulo.mercadolibre.com.mx/MLM-2001356', last_sync:'2026-05-10T13:35:00Z' },
]

export const mockMLOrders: MLOrder[] = [
  {
    id:'1', order_id:'2026-0841', date_created:'2026-05-10T09:30:00Z',
    status:'paid', buyer_nickname:'CONSTRUCTOR_PRO', buyer_phone:'+52 222 555 1234',
    items:[{ id:'i1', title:'Taladro Percutor 850W', sku:'TAL-003', quantity:2, unit_price:1540 }],
    total_amount:3080, shipping_type:'mercado_envios', shipping_status:'ready_to_ship',
    tracking_number:null, payment_type:'credit_card', payment_status:'approved',
  },
  {
    id:'2', order_id:'2026-0840', date_created:'2026-05-10T11:15:00Z',
    status:'paid', buyer_nickname:'FERRETERIA_MODERNA', buyer_phone:'+52 222 555 5678',
    items:[{ id:'i2', title:'Compresor de Aire 25L', sku:'KAP-007', quantity:1, unit_price:3299 }],
    total_amount:3299, shipping_type:'mercado_envios', shipping_status:'ready_to_ship',
    tracking_number:null, payment_type:'mercadopago', payment_status:'approved',
  },
  {
    id:'3', order_id:'2026-0839', date_created:'2026-05-09T14:20:00Z',
    status:'shipped', buyer_nickname:'TALLER_EL_MAESTRO', buyer_phone:'+52 222 555 9012',
    items:[{ id:'i3', title:'Llave de Impacto Neumática', sku:'KAP-011', quantity:2, unit_price:1180 }],
    total_amount:2360, shipping_type:'mercado_envios', shipping_status:'shipped',
    tracking_number:'SK-9182736', payment_type:'credit_card', payment_status:'approved',
  },
  {
    id:'4', order_id:'2026-0838', date_created:'2026-05-09T10:05:00Z',
    status:'delivered', buyer_nickname:'CONSTRUCTORA_ABC', buyer_phone:'+52 222 555 3456',
    items:[
      { id:'i4a', title:'Taladro Inalámbrico 20V', sku:'TAL-001', quantity:1, unit_price:2890 },
      { id:'i4b', title:'Set Brocas 29 pzs', sku:'BRO-002', quantity:2, unit_price:420 },
    ],
    total_amount:3730, shipping_type:'mercado_envios', shipping_status:'delivered',
    tracking_number:'SK-9182701', payment_type:'mercadopago', payment_status:'approved',
  },
  {
    id:'5', order_id:'2026-0837', date_created:'2026-05-08T16:40:00Z',
    status:'delivered', buyer_nickname:'OBRA_NORTE_MX', buyer_phone:'+52 222 555 7890',
    items:[{ id:'i5', title:'Arnés de Seguridad', sku:'ARN-002', quantity:5, unit_price:680 }],
    total_amount:3400, shipping_type:'self_service', shipping_status:'delivered',
    tracking_number:'SK-9182644', payment_type:'credit_card', payment_status:'approved',
  },
  {
    id:'6', order_id:'2026-0836', date_created:'2026-05-08T09:15:00Z',
    status:'shipped', buyer_nickname:'BODEGA_CENTRAL', buyer_phone:'+52 222 555 2345',
    items:[{ id:'i6', title:'Nivel Láser 360°', sku:'NIV-004', quantity:1, unit_price:1890 }],
    total_amount:1890, shipping_type:'mercado_envios', shipping_status:'shipped',
    tracking_number:'SK-9182598', payment_type:'mercadopago', payment_status:'approved',
  },
  {
    id:'7', order_id:'2026-0835', date_created:'2026-05-07T13:50:00Z',
    status:'confirmed', buyer_nickname:'DISTRIBUIDOR_PUEBLA', buyer_phone:'+52 222 555 6789',
    items:[{ id:'i7', title:'Taladro de Columna 350W', sku:'TAL-008', quantity:1, unit_price:5400 }],
    total_amount:5400, shipping_type:'mercado_envios', shipping_status:'handling',
    tracking_number:null, payment_type:'transfer', payment_status:'approved',
  },
  {
    id:'8', order_id:'2026-0834', date_created:'2026-05-07T08:30:00Z',
    status:'cancelled', buyer_nickname:'COMPRADOR_ANON', buyer_phone:'+52 222 555 0001',
    items:[{ id:'i8', title:'Sierra Circular 1400W', sku:'SIE-002', quantity:1, unit_price:1899 }],
    total_amount:1899, shipping_type:'mercado_envios', shipping_status:'pending',
    tracking_number:null, payment_type:'credit_card', payment_status:'rejected',
  },
  {
    id:'9', order_id:'2026-0833', date_created:'2026-05-06T15:20:00Z',
    status:'delivered', buyer_nickname:'TALLER_MECANICO_MX', buyer_phone:'+52 222 555 4567',
    items:[{ id:'i9', title:'Taladro Percutor 850W', sku:'TAL-003', quantity:3, unit_price:1540 }],
    total_amount:4620, shipping_type:'mercado_envios', shipping_status:'delivered',
    tracking_number:'SK-9182511', payment_type:'mercadopago', payment_status:'approved',
  },
  {
    id:'10', order_id:'2026-0832', date_created:'2026-05-06T10:05:00Z',
    status:'paid', buyer_nickname:'EMPRESA_SA_DE_CV', buyer_phone:'+52 222 555 8901',
    items:[
      { id:'i10a', title:'Calibrador Vernier Digital', sku:'CAL-001', quantity:3, unit_price:299 },
      { id:'i10b', title:'Broca Diamantada 100mm', sku:'BRO-015', quantity:2, unit_price:340 },
    ],
    total_amount:1577, shipping_type:'self_service', shipping_status:'ready_to_ship',
    tracking_number:null, payment_type:'credit_card', payment_status:'approved',
  },
]

export const mockMLQuestions: MLQuestion[] = [
  { id:'1', question:'¿El compresor incluye manguera y pistola de inflado?', status:'unanswered', date_created:'2026-05-10T14:10:00Z', item_id:'MLM-2001347', item_title:'Compresor de Aire 25L 2HP', item_sku:'KAP-007', from_nickname:'TALLER_MECANICO' },
  { id:'2', question:'¿Hacen factura? Somos empresa, necesitamos CFDI.', status:'unanswered', date_created:'2026-05-10T13:45:00Z', item_id:'MLM-2001345', item_title:'Taladro Percutor 850W', item_sku:'TAL-003', from_nickname:'EMPRESA_SA' },
  { id:'3', question:'¿Tienen el taladro en color azul o solo viene en negro?', status:'unanswered', date_created:'2026-05-10T12:30:00Z', item_id:'MLM-2001345', item_title:'Taladro Percutor 850W', item_sku:'TAL-003', from_nickname:'COMPRADOR123' },
  { id:'4', question:'¿El nivel láser funciona en exteriores con luz solar directa?', answer:'Hola! El nivel láser tiene modo pulso para exteriores. Con su detector incluido funciona perfecto bajo luz solar. ¡Saludos!', status:'answered', date_created:'2026-05-10T09:20:00Z', item_id:'MLM-2001351', item_title:'Nivel Láser 360° Automático', item_sku:'NIV-004', from_nickname:'CONSTRUCTOR_GDLX' },
  { id:'5', question:'¿Cuánto tiempo de garantía tiene el taladro inalámbrico?', answer:'Hola! El taladro inalámbrico tiene 1 año de garantía de fábrica. Nosotros somos distribuidores autorizados. Cualquier falla la atendemos de inmediato. ¡Saludos!', status:'answered', date_created:'2026-05-09T16:40:00Z', item_id:'MLM-2001346', item_title:'Taladro Inalámbrico 20V', item_sku:'TAL-001', from_nickname:'FERRETERIA_NORTE' },
  { id:'6', question:'¿El arnés cumple con la norma NOM-009-STPS?', answer:'Sí, nuestro arnés cumple con NOM-009-STPS-2011 y está certificado. Incluye etiqueta de certificación. Podemos enviarte ficha técnica por correo. ¡Saludos!', status:'answered', date_created:'2026-05-09T11:15:00Z', item_id:'MLM-2001354', item_title:'Arnés de Seguridad Industrial', item_sku:'ARN-002', from_nickname:'SEGURIDAD_INDUSTRIAL_MX' },
  { id:'7', question:'¿Hacen envíos a Cancún? ¿Cuánto tarda?', answer:'Hola! Sí enviamos a Cancún por Mercado Envíos. El tiempo es 3-5 días hábiles con guía incluida en el precio. ¡Saludos!', status:'answered', date_created:'2026-05-08T14:30:00Z', item_id:'MLM-2001347', item_title:'Compresor de Aire 25L', item_sku:'KAP-007', from_nickname:'TECNICO_CANCUN' },
  { id:'8', question:'¿El set de brocas incluye brocas para vidrio y cerámica?', answer:'Hola! El set incluye brocas para metal, madera y concreto. Para vidrio y cerámica tenemos otro set especializado (SKU VID-001). ¡Saludos!', status:'answered', date_created:'2026-05-08T10:05:00Z', item_id:'MLM-2001349', item_title:'Set Brocas Multicombinación 29 pzs', item_sku:'BRO-002', from_nickname:'PLOMERO_REGIO' },
]

export const mockMLStats = {
  total_products: 47,
  active_products: 42,
  paused_products: 5,
  total_sales_month: 94250,
  orders_this_month: 38,
  ready_to_ship: 3,
  unanswered_questions: 3,
  avg_response_time_hrs: 3.2,
}

// ─────────────────────────────────────────────────────────────────────────────
// AMAZON
// ─────────────────────────────────────────────────────────────────────────────

export interface AmazonProduct {
  id: string
  asin: string
  sku: string
  title: string
  price: number
  fulfillment_channel: 'FBA' | 'FBM'
  quantity: number
  fba_quantity: number
  reserved_quantity: number
  inbound_quantity: number
  condition: 'new' | 'used_like_new' | 'used_good'
  status: 'active' | 'inactive' | 'incomplete'
  sales_rank: number
  last_sale: string
  fees: { referral: number; fba: number; storage: number }
  profit_margin: number
}

export interface FBAShipmentItem {
  sku: string
  title: string
  quantity_shipped: number
  quantity_received: number
}

export interface FBAShipment {
  id: string
  shipment_id: string
  name: string
  destination_fc: string
  status: 'working' | 'shipped' | 'in_transit' | 'receiving' | 'closed'
  created_date: string
  ship_date: string | null
  items: FBAShipmentItem[]
  total_units: number
  tracking_number: string | null
}

export interface AmazonInventoryItem {
  sku: string
  asin: string
  title: string
  fnsku: string
  fulfillment_center: string
  quantity: number
  reserved: number
  inbound: number
  unfulfillable: number
  storage_type: 'standard' | 'oversize'
  age_days: number
  last_updated: string
}

export interface AmazonSalesMonth {
  month: string
  revenue: number
  units: number
  orders: number
}

export const mockAmazonProducts: AmazonProduct[] = [
  { id:'1', asin:'B08XYZ1001', sku:'KAP-TAL-003-FBA', title:'Taladro Percutor Inalámbrico 20V 2 Baterías', price:89.99,  fulfillment_channel:'FBA', quantity:145, fba_quantity:145, reserved_quantity:12, inbound_quantity:50,  condition:'new', status:'active', sales_rank:1247,  last_sale:'2026-05-10T12:30:00Z', fees:{ referral:13.50, fba:5.23, storage:0.85 }, profit_margin:42.5 },
  { id:'2', asin:'B09ABC2002', sku:'KAP-COM-007-FBA', title:'Compresor Aire Portátil 6 Galones 150 PSI',   price:149.99, fulfillment_channel:'FBA', quantity:34,  fba_quantity:34,  reserved_quantity:3,  inbound_quantity:25,  condition:'new', status:'active', sales_rank:3421,  last_sale:'2026-05-09T18:45:00Z', fees:{ referral:22.50, fba:8.47, storage:2.15 }, profit_margin:38.2 },
  { id:'3', asin:'B07DEF3003', sku:'KAP-KIT-105-FBM', title:'Kit Herramientas Profesional 128 Piezas',     price:65.99,  fulfillment_channel:'FBM', quantity:87,  fba_quantity:0,   reserved_quantity:0,  inbound_quantity:0,   condition:'new', status:'active', sales_rank:892,   last_sale:'2026-05-10T08:15:00Z', fees:{ referral:9.90,  fba:0,    storage:0    }, profit_margin:55.8 },
  { id:'4', asin:'B06GHI4004', sku:'KAP-SIE-210-FBA', title:'Sierra Circular 7-1/4" 15 Amp con Guía Láser', price:119.99, fulfillment_channel:'FBA', quantity:8,   fba_quantity:8,   reserved_quantity:1,  inbound_quantity:40,  condition:'new', status:'active', sales_rank:5678,  last_sale:'2026-05-08T14:20:00Z', fees:{ referral:18.00, fba:6.95, storage:1.45 }, profit_margin:35.7 },
  { id:'5', asin:'B08JKL5005', sku:'KAP-LIJ-450-FBA', title:'Lijadora Orbital Eléctrica 2.4A 14000 OPM',   price:45.99,  fulfillment_channel:'FBA', quantity:0,   fba_quantity:0,   reserved_quantity:0,  inbound_quantity:75,  condition:'new', status:'active', sales_rank:2156,  last_sale:'2026-05-07T10:30:00Z', fees:{ referral:6.90,  fba:4.12, storage:0.65 }, profit_margin:48.3 },
  { id:'6', asin:'B05MNO6006', sku:'KAP-TAL-001-FBA', title:'Taladro Inalámbrico 12V con Maletín',         price:69.99,  fulfillment_channel:'FBA', quantity:23,  fba_quantity:23,  reserved_quantity:2,  inbound_quantity:0,   condition:'new', status:'active', sales_rank:4102,  last_sale:'2026-05-10T06:50:00Z', fees:{ referral:10.50, fba:4.95, storage:0.72 }, profit_margin:44.1 },
  { id:'7', asin:'B04PQR7007', sku:'KAP-NIV-004-FBM', title:'Nivel Láser 360° Automático Autonivelante',   price:129.99, fulfillment_channel:'FBM', quantity:31,  fba_quantity:0,   reserved_quantity:0,  inbound_quantity:0,   condition:'new', status:'active', sales_rank:1893,  last_sale:'2026-05-09T15:10:00Z', fees:{ referral:19.50, fba:0,    storage:0    }, profit_margin:51.2 },
  { id:'8', asin:'B03STU8008', sku:'KAP-BRO-029-FBM', title:'Set Brocas Multicombinación 29 Piezas HSS',   price:34.99,  fulfillment_channel:'FBM', quantity:156, fba_quantity:0,   reserved_quantity:0,  inbound_quantity:0,   condition:'new', status:'active', sales_rank:634,   last_sale:'2026-05-10T14:05:00Z', fees:{ referral:5.25,  fba:0,    storage:0    }, profit_margin:62.4 },
]

export const mockFBAShipments: FBAShipment[] = [
  {
    id:'1', shipment_id:'FBA17XYZ1234', name:'Restock Mayo — Herramientas Eléctricas',
    destination_fc:'PHX7 · Phoenix, AZ', status:'in_transit',
    created_date:'2026-05-05T10:00:00Z', ship_date:'2026-05-07T14:30:00Z',
    items:[
      { sku:'KAP-TAL-003-FBA', title:'Taladro Percutor 20V', quantity_shipped:50, quantity_received:0 },
      { sku:'KAP-COM-007-FBA', title:'Compresor 6 Galones',   quantity_shipped:25, quantity_received:0 },
    ],
    total_units:75, tracking_number:'1Z9999W99999999999',
  },
  {
    id:'2', shipment_id:'FBA17ABC5678', name:'Restock Abril — Lijadoras',
    destination_fc:'ONT8 · San Bernardino, CA', status:'receiving',
    created_date:'2026-04-28T09:00:00Z', ship_date:'2026-04-30T11:15:00Z',
    items:[
      { sku:'KAP-LIJ-450-FBA', title:'Lijadora Orbital 2.4A', quantity_shipped:75, quantity_received:68 },
    ],
    total_units:75, tracking_number:'7489348923742874',
  },
  {
    id:'3', shipment_id:'FBA17DEF9012', name:'Restock Mayo — Sierras',
    destination_fc:'DFW6 · Fort Worth, TX', status:'working',
    created_date:'2026-05-09T15:30:00Z', ship_date:null,
    items:[
      { sku:'KAP-SIE-210-FBA', title:'Sierra Circular 7-1/4"', quantity_shipped:40, quantity_received:0 },
    ],
    total_units:40, tracking_number:null,
  },
  {
    id:'4', shipment_id:'FBA17GHI3456', name:'Restock Mayo 2 — Taladros 12V',
    destination_fc:'PHX7 · Phoenix, AZ', status:'shipped',
    created_date:'2026-05-08T08:00:00Z', ship_date:'2026-05-09T16:45:00Z',
    items:[
      { sku:'KAP-TAL-001-FBA', title:'Taladro Inalámbrico 12V', quantity_shipped:30, quantity_received:0 },
    ],
    total_units:30, tracking_number:'9400111899227457272890',
  },
  {
    id:'5', shipment_id:'FBA17JKL7890', name:'Restock Marzo — Cerrado',
    destination_fc:'PHX7 · Phoenix, AZ', status:'closed',
    created_date:'2026-03-15T10:00:00Z', ship_date:'2026-03-17T09:30:00Z',
    items:[
      { sku:'KAP-TAL-003-FBA', title:'Taladro Percutor 20V', quantity_shipped:60, quantity_received:60 },
      { sku:'KAP-COM-007-FBA', title:'Compresor 6 Galones',   quantity_shipped:20, quantity_received:20 },
    ],
    total_units:80, tracking_number:'1Z9888W88888888888',
  },
]

export const mockAmazonInventory: AmazonInventoryItem[] = [
  { sku:'KAP-TAL-003-FBA', asin:'B08XYZ1001', title:'Taladro Percutor Inalámbrico 20V', fnsku:'X001ABCDEF', fulfillment_center:'PHX7', quantity:145, reserved:12, inbound:50,  unfulfillable:2,  storage_type:'standard', age_days:45,  last_updated:'2026-05-10T14:00:00Z' },
  { sku:'KAP-COM-007-FBA', asin:'B09ABC2002', title:'Compresor Aire 6 Galones 150 PSI', fnsku:'X002GHIJKL', fulfillment_center:'PHX7', quantity:34,  reserved:3,  inbound:25,  unfulfillable:1,  storage_type:'oversize', age_days:67,  last_updated:'2026-05-10T13:45:00Z' },
  { sku:'KAP-SIE-210-FBA', asin:'B06GHI4004', title:'Sierra Circular 7-1/4" 15 Amp',   fnsku:'X003MNOPQR', fulfillment_center:'DFW6', quantity:8,   reserved:1,  inbound:40,  unfulfillable:0,  storage_type:'standard', age_days:23,  last_updated:'2026-05-10T13:30:00Z' },
  { sku:'KAP-LIJ-450-FBA', asin:'B08JKL5005', title:'Lijadora Orbital 2.4A 14000 OPM', fnsku:'X004STUVWX', fulfillment_center:'ONT8', quantity:0,   reserved:0,  inbound:68,  unfulfillable:7,  storage_type:'standard', age_days:34,  last_updated:'2026-05-10T13:00:00Z' },
  { sku:'KAP-TAL-001-FBA', asin:'B05MNO6006', title:'Taladro Inalámbrico 12V Maletín',  fnsku:'X005YZABCD', fulfillment_center:'PHX7', quantity:23,  reserved:2,  inbound:30,  unfulfillable:0,  storage_type:'standard', age_days:89,  last_updated:'2026-05-10T12:00:00Z' },
  { sku:'KAP-SIE-210-OLD', asin:'B06GHI4004', title:'Sierra Circular 7-1/4" (Lote Mar)', fnsku:'X006EFGHIJ', fulfillment_center:'DFW6', quantity:4,   reserved:0,  inbound:0,   unfulfillable:2,  storage_type:'standard', age_days:245, last_updated:'2026-05-10T11:00:00Z' },
]

export const mockAmazonSales: AmazonSalesMonth[] = [
  { month:'Nov 2025', revenue:41200, units:312, orders:278 },
  { month:'Dic 2025', revenue:58900, units:445, orders:401 },
  { month:'Ene 2026', revenue:38750, units:294, orders:262 },
  { month:'Feb 2026', revenue:44100, units:334, orders:301 },
  { month:'Mar 2026', revenue:52300, units:396, orders:355 },
  { month:'Abr 2026', revenue:61480, units:466, orders:419 },
  { month:'May 2026', revenue:67543, units:511, orders:461 },
]

export const mockAmazonStats = {
  total_products: 52,
  fba_products: 38,
  fbm_products: 14,
  active_listings: 47,
  total_inventory_value: 145678,
  fba_inventory_units: 214,
  monthly_revenue: 67543,
  avg_profit_margin: 47.1,
  pending_shipments: 4,
  low_stock_alerts: 3,
  units_sold_month: 511,
  best_seller_rank: 634,
}

// ============================================
// SHOPIFY - MOCK DATA
// ============================================

export interface ShopifyProduct {
  id: string
  shopify_id: string
  handle: string
  title: string
  vendor: string
  product_type: string
  variants: Array<{ id: string; title: string; sku: string; price: number; inventory_quantity: number; weight: number }>
  status: 'active' | 'draft' | 'archived'
  published_at?: string
  tags: string[]
  total_inventory: number
  total_variants: number
}

export interface ShopifyOrder {
  id: string
  order_number: number
  email: string
  created_at: string
  financial_status: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided'
  fulfillment_status: 'fulfilled' | 'partial' | 'unfulfilled' | null
  customer: { first_name: string; last_name: string; email: string; phone?: string }
  line_items: Array<{ title: string; variant_title: string; quantity: number; price: number; sku: string }>
  total_price: number
  subtotal_price: number
  total_tax: number
  shipping_address: { name: string; address1: string; city: string; province: string; zip: string; country: string }
}

export const mockShopifyProducts: ShopifyProduct[] = [
  { id:'1', shopify_id:'gid://shopify/Product/7891234567890', handle:'taladro-percutor-800w', title:'Taladro Percutor 800W Profesional', vendor:'Kap Tools', product_type:'Herramientas Eléctricas', variants:[{ id:'v1', title:'Azul / 800W', sku:'KAP-TAL-003-BLUE', price:1299, inventory_quantity:34, weight:2.5 },{ id:'v2', title:'Negro / 800W', sku:'KAP-TAL-003-BLACK', price:1299, inventory_quantity:28, weight:2.5 }], status:'active', published_at:'2026-03-15T10:00:00Z', tags:['herramientas','taladros','profesional','nuevo'], total_inventory:62, total_variants:2 },
  { id:'2', shopify_id:'gid://shopify/Product/7891234567891', handle:'compresor-aire-25l-2hp', title:'Compresor de Aire 25L 2HP', vendor:'Kap Tools', product_type:'Compresores', variants:[{ id:'v3', title:'Estándar', sku:'KAP-COM-007', price:2499, inventory_quantity:12, weight:18.5 }], status:'active', published_at:'2026-04-01T12:00:00Z', tags:['compresores','aire','profesional'], total_inventory:12, total_variants:1 },
  { id:'3', shopify_id:'gid://shopify/Product/7891234567892', handle:'kit-destornilladores-32pz', title:'Kit Destornilladores Precisión 32 Piezas', vendor:'Kap Tools', product_type:'Kits de Herramientas', variants:[{ id:'v4', title:'Kit Completo', sku:'KAP-KIT-032', price:299, inventory_quantity:156, weight:0.8 }], status:'active', published_at:'2026-02-10T09:00:00Z', tags:['kits','destornilladores','best-seller'], total_inventory:156, total_variants:1 },
  { id:'4', shopify_id:'gid://shopify/Product/7891234567893', handle:'sierra-circular-1400w-laser', title:'Sierra Circular 1400W con Láser', vendor:'Kap Tools', product_type:'Sierras', variants:[{ id:'v5', title:'185mm / 1400W', sku:'KAP-SIE-140', price:1899, inventory_quantity:0, weight:4.2 }], status:'active', published_at:'2026-03-20T14:00:00Z', tags:['sierras','laser','profesional','agotado'], total_inventory:0, total_variants:1 },
  { id:'5', shopify_id:'gid://shopify/Product/7891234567894', handle:'amoladora-angular-115mm-700w', title:'Amoladora Angular 115mm 700W', vendor:'Kap Tools', product_type:'Amoladoras', variants:[{ id:'v6', title:'Estándar 700W', sku:'KAP-AMO-700', price:849, inventory_quantity:45, weight:1.8 }], status:'active', published_at:'2026-04-05T11:00:00Z', tags:['amoladoras','electrico'], total_inventory:45, total_variants:1 },
  { id:'6', shopify_id:'gid://shopify/Product/7891234567895', handle:'nivel-laser-3-lineas', title:'Nivel Láser Autonivelante 3 Líneas', vendor:'Kap Tools', product_type:'Medición', variants:[{ id:'v7', title:'Verde / 30m', sku:'KAP-NIV-3LG', price:1649, inventory_quantity:8, weight:0.6 },{ id:'v8', title:'Rojo / 15m', sku:'KAP-NIV-3LR', price:1199, inventory_quantity:11, weight:0.5 }], status:'active', published_at:'2026-04-18T09:30:00Z', tags:['medicion','laser','construccion'], total_inventory:19, total_variants:2 },
  { id:'7', shopify_id:'gid://shopify/Product/7891234567896', handle:'set-llaves-allen-10pz', title:'Set Llaves Allen 10 Piezas Pro', vendor:'Kap Tools', product_type:'Llaves y Fijadores', variants:[{ id:'v9', title:'Métrico', sku:'KAP-LLA-010M', price:189, inventory_quantity:0, weight:0.3 },{ id:'v10', title:'SAE', sku:'KAP-LLA-010S', price:189, inventory_quantity:0, weight:0.3 }], status:'draft', tags:['llaves','allen'], total_inventory:0, total_variants:2 },
  { id:'8', shopify_id:'gid://shopify/Product/7891234567897', handle:'esmeriladora-banco-6-350w', title:'Esmeriladora de Banco 6" 350W', vendor:'Kap Tools', product_type:'Herramientas de Banco', variants:[{ id:'v11', title:'Estándar 350W', sku:'KAP-ESM-350', price:1349, inventory_quantity:17, weight:8.5 }], status:'active', published_at:'2026-05-02T16:00:00Z', tags:['esmeriladora','banco'], total_inventory:17, total_variants:1 },
]

export const mockShopifyOrders: ShopifyOrder[] = [
  { id:'1', order_number:1045, email:'cliente@email.com', created_at:'2026-05-10T10:30:00Z', financial_status:'paid', fulfillment_status:'unfulfilled', customer:{ first_name:'Juan', last_name:'Pérez', email:'cliente@email.com', phone:'+52 222 555 1234' }, line_items:[{ title:'Taladro Percutor 800W Profesional', variant_title:'Azul / 800W', quantity:1, price:1299, sku:'KAP-TAL-003-BLUE' },{ title:'Kit Destornilladores 32 Piezas', variant_title:'Kit Completo', quantity:2, price:299, sku:'KAP-KIT-032' }], total_price:1897, subtotal_price:1897, total_tax:0, shipping_address:{ name:'Juan Pérez', address1:'Av. Juárez 123', city:'Puebla', province:'Puebla', zip:'72000', country:'México' } },
  { id:'2', order_number:1046, email:'empresa@construccion.com', created_at:'2026-05-10T11:45:00Z', financial_status:'paid', fulfillment_status:'fulfilled', customer:{ first_name:'María', last_name:'González', email:'empresa@construccion.com', phone:'+52 222 555 5678' }, line_items:[{ title:'Compresor de Aire 25L 2HP', variant_title:'Estándar', quantity:1, price:2499, sku:'KAP-COM-007' }], total_price:2499, subtotal_price:2499, total_tax:0, shipping_address:{ name:'María González', address1:'Calle Reforma 456', city:'Cholula', province:'Puebla', zip:'72810', country:'México' } },
  { id:'3', order_number:1047, email:'taller@mecanica.com', created_at:'2026-05-09T14:20:00Z', financial_status:'paid', fulfillment_status:'unfulfilled', customer:{ first_name:'Carlos', last_name:'Ramírez', email:'taller@mecanica.com' }, line_items:[{ title:'Amoladora Angular 115mm 700W', variant_title:'Estándar 700W', quantity:3, price:849, sku:'KAP-AMO-700' }], total_price:2547, subtotal_price:2547, total_tax:0, shipping_address:{ name:'Carlos Ramírez', address1:'Industrial Norte Km 4', city:'San Martín', province:'Puebla', zip:'74120', country:'México' } },
  { id:'4', order_number:1048, email:'ferreteria@regional.com', created_at:'2026-05-09T09:00:00Z', financial_status:'paid', fulfillment_status:'partial', customer:{ first_name:'Ana', last_name:'Torres', email:'ferreteria@regional.com', phone:'+52 222 777 8899' }, line_items:[{ title:'Kit Destornilladores 32 Piezas', variant_title:'Kit Completo', quantity:10, price:299, sku:'KAP-KIT-032' },{ title:'Nivel Láser 3 Líneas', variant_title:'Verde / 30m', quantity:2, price:1649, sku:'KAP-NIV-3LG' }], total_price:6288, subtotal_price:6288, total_tax:0, shipping_address:{ name:'Ana Torres', address1:'Benito Juárez 78', city:'Tlaxcala', province:'Tlaxcala', zip:'90000', country:'México' } },
  { id:'5', order_number:1049, email:'construye@mx.com', created_at:'2026-05-08T16:30:00Z', financial_status:'pending', fulfillment_status:null, customer:{ first_name:'Roberto', last_name:'Sánchez', email:'construye@mx.com', phone:'+52 222 111 2233' }, line_items:[{ title:'Sierra Circular 1400W con Láser', variant_title:'185mm / 1400W', quantity:1, price:1899, sku:'KAP-SIE-140' }], total_price:1899, subtotal_price:1899, total_tax:0, shipping_address:{ name:'Roberto Sánchez', address1:'Av. Del Trabajo 234', city:'Apizaco', province:'Tlaxcala', zip:'90300', country:'México' } },
  { id:'6', order_number:1050, email:'maestro@obra.mx', created_at:'2026-05-08T11:15:00Z', financial_status:'paid', fulfillment_status:'fulfilled', customer:{ first_name:'Luis', last_name:'Martínez', email:'maestro@obra.mx' }, line_items:[{ title:'Esmeriladora de Banco 6" 350W', variant_title:'Estándar 350W', quantity:1, price:1349, sku:'KAP-ESM-350' },{ title:'Kit Destornilladores 32 Piezas', variant_title:'Kit Completo', quantity:1, price:299, sku:'KAP-KIT-032' }], total_price:1648, subtotal_price:1648, total_tax:0, shipping_address:{ name:'Luis Martínez', address1:'Priv. Las Rosas 56', city:'Puebla', province:'Puebla', zip:'72410', country:'México' } },
  { id:'7', order_number:1051, email:'hdez@gmail.com', created_at:'2026-05-07T08:45:00Z', financial_status:'refunded', fulfillment_status:'fulfilled', customer:{ first_name:'Sofía', last_name:'Hernández', email:'hdez@gmail.com' }, line_items:[{ title:'Nivel Láser 3 Líneas', variant_title:'Rojo / 15m', quantity:1, price:1199, sku:'KAP-NIV-3LR' }], total_price:1199, subtotal_price:1199, total_tax:0, shipping_address:{ name:'Sofía Hernández', address1:'Cto. Campeche 12', city:'Puebla', province:'Puebla', zip:'72000', country:'México' } },
  { id:'8', order_number:1052, email:'distribuidora@norte.com', created_at:'2026-05-07T13:20:00Z', financial_status:'paid', fulfillment_status:'unfulfilled', customer:{ first_name:'Miguel', last_name:'Flores', email:'distribuidora@norte.com', phone:'+52 222 444 5566' }, line_items:[{ title:'Taladro Percutor 800W Profesional', variant_title:'Negro / 800W', quantity:2, price:1299, sku:'KAP-TAL-003-BLACK' },{ title:'Amoladora Angular 115mm 700W', variant_title:'Estándar 700W', quantity:2, price:849, sku:'KAP-AMO-700' }], total_price:4296, subtotal_price:4296, total_tax:0, shipping_address:{ name:'Miguel Flores', address1:'Blvd. Norte 890', city:'Puebla', province:'Puebla', zip:'72000', country:'México' } },
]

export const mockShopifyStats = {
  total_products: 38,
  active_products: 34,
  draft_products: 3,
  archived_products: 1,
  total_orders_month: 87,
  revenue_month: 134567.50,
  avg_order_value: 1547.43,
  pending_fulfillment: 12,
}

// ============================================
// CRM PIPELINE - MOCK DATA
// ============================================

export interface CRMDeal {
  id: string
  title: string
  company: string
  contact: { name: string; email: string; phone: string }
  value: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expected_close_date: string
  created_at: string
  source: 'website' | 'referral' | 'cold_call' | 'trade_show' | 'linkedin'
  assigned_to: string
  notes?: string
  last_activity: string
}

export const mockCRMDeals: CRMDeal[] = [
  { id:'1', title:'Suministro Herramientas — Constructora XYZ', company:'Constructora XYZ S.A.', contact:{ name:'Ing. Roberto Sánchez', email:'roberto@constructoraxyz.com', phone:'+52 222 111 2233' }, value:125000, stage:'negotiation', probability:75, expected_close_date:'2026-05-30', created_at:'2026-04-15T09:00:00Z', source:'referral', assigned_to:'Carlos Cortés', notes:'Interesado en contrato anual, necesita aprobación CFO', last_activity:'2026-05-09T14:30:00Z' },
  { id:'2', title:'Equipamiento Completo — Taller Mecánico', company:'Taller El Águila', contact:{ name:'José Luis Morales', email:'jl@talleraguila.com', phone:'+52 222 333 4455' }, value:45000, stage:'proposal', probability:50, expected_close_date:'2026-06-15', created_at:'2026-05-01T10:30:00Z', source:'website', assigned_to:'Carlos Cortés', notes:'Enviar cotización con descuento volumen', last_activity:'2026-05-10T09:15:00Z' },
  { id:'3', title:'Herramientas Prof. — Empresa Eléctrica', company:'Instalaciones Eléctricas del Bajío', contact:{ name:'Ana Patricia Rivas', email:'arivas@iebajio.com', phone:'+52 222 555 6677' }, value:78000, stage:'qualified', probability:40, expected_close_date:'2026-07-01', created_at:'2026-05-05T11:00:00Z', source:'linkedin', assigned_to:'Carlos Cortés', notes:'Requiere certificaciones y garantías extendidas', last_activity:'2026-05-08T16:45:00Z' },
  { id:'4', title:'Nuevo Prospecto — Ferretería Regional', company:'Ferretería La Central', contact:{ name:'Miguel Ángel Torres', email:'mtorres@ferreteriacentral.com', phone:'+52 222 777 8899' }, value:32000, stage:'lead', probability:20, expected_close_date:'2026-08-01', created_at:'2026-05-09T15:20:00Z', source:'trade_show', assigned_to:'Carlos Cortés', last_activity:'2026-05-09T15:20:00Z' },
  { id:'5', title:'Contrato Anual — Distribuidora Norte', company:'Distribuidora Norte SA de CV', contact:{ name:'Lic. Patricia Vega', email:'pvega@disnorte.com', phone:'+52 222 888 9900' }, value:215000, stage:'closed_won', probability:100, expected_close_date:'2026-05-01', created_at:'2026-03-10T09:00:00Z', source:'referral', assigned_to:'Carlos Cortés', notes:'Contrato 3 años con renovación automática', last_activity:'2026-05-01T10:00:00Z' },
  { id:'6', title:'Herramientas Industria — Textil del Centro', company:'Textil del Centro S.A.', contact:{ name:'Ing. Fernando Cruz', email:'fcruz@textilcentro.com', phone:'+52 222 666 7788' }, value:28000, stage:'closed_lost', probability:0, expected_close_date:'2026-04-30', created_at:'2026-03-15T14:00:00Z', source:'cold_call', assigned_to:'Carlos Cortés', notes:'Eligió competidor por precio, revisitar Q3', last_activity:'2026-04-30T17:00:00Z' },
  { id:'7', title:'Kit Herramientas — Academia Técnica CECATI', company:'CECATI Plantel 145', contact:{ name:'Lic. Susana López', email:'slopez@cecati145.edu.mx', phone:'+52 222 100 2003' }, value:67500, stage:'proposal', probability:60, expected_close_date:'2026-06-30', created_at:'2026-04-28T10:00:00Z', source:'website', assigned_to:'Carlos Cortés', notes:'Licitación pública, requiere factura gobierno', last_activity:'2026-05-07T11:30:00Z' },
  { id:'8', title:'Reequipamiento — Taller Automotriz Premium', company:'Autos Premium Puebla', contact:{ name:'Ing. David Ortíz', email:'dortiz@autopremium.mx', phone:'+52 222 500 6007' }, value:89000, stage:'negotiation', probability:80, expected_close_date:'2026-05-25', created_at:'2026-04-20T09:30:00Z', source:'referral', assigned_to:'Carlos Cortés', notes:'Solicitan demo + financiamiento 6 meses', last_activity:'2026-05-10T08:00:00Z' },
]

export const mockCRMStats = {
  total_deals: 24,
  total_pipeline_value: 567800,
  avg_deal_size: 23658,
  won_this_month: 3,
  won_value_month: 87500,
  conversion_rate: 42.5,
  avg_sales_cycle: 45,
}

// ============================================
// ERP INVENTARIO - MOCK DATA
// ============================================

export interface ERPInventoryItem {
  id: string
  sku: string
  name: string
  category: string
  warehouse: string
  quantity: number
  reserved: number
  available: number
  unit_cost: number
  total_value: number
  reorder_point: number
  reorder_quantity: number
  supplier: string
  last_restock: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked'
}

export const mockERPInventory: ERPInventoryItem[] = [
  { id:'1', sku:'KAP-TAL-003', name:'Taladro Percutor 800W', category:'Herramientas Eléctricas', warehouse:'Almacén Principal Puebla', quantity:145, reserved:23, available:122, unit_cost:750, total_value:108750, reorder_point:50, reorder_quantity:100, supplier:'Proveedor Industrial Norte', last_restock:'2026-04-15', status:'in_stock' },
  { id:'2', sku:'KAP-COM-007', name:'Compresor 25L 2HP', category:'Compresores', warehouse:'Almacén Principal Puebla', quantity:8, reserved:3, available:5, unit_cost:1450, total_value:11600, reorder_point:10, reorder_quantity:25, supplier:'Distribuidora Herramientas Pro', last_restock:'2026-03-28', status:'low_stock' },
  { id:'3', sku:'KAP-KIT-032', name:'Kit Destornilladores 32pz', category:'Kits', warehouse:'Almacén Principal Puebla', quantity:456, reserved:45, available:411, unit_cost:120, total_value:54720, reorder_point:100, reorder_quantity:200, supplier:'Importadora Tools MX', last_restock:'2026-04-20', status:'overstocked' },
  { id:'4', sku:'KAP-SIE-140', name:'Sierra Circular 1400W', category:'Sierras', warehouse:'Almacén Principal Puebla', quantity:0, reserved:0, available:0, unit_cost:1050, total_value:0, reorder_point:15, reorder_quantity:50, supplier:'Proveedor Industrial Norte', last_restock:'2026-02-10', status:'out_of_stock' },
  { id:'5', sku:'KAP-AMO-700', name:'Amoladora Angular 700W', category:'Amoladoras', warehouse:'Almacén Principal Puebla', quantity:78, reserved:12, available:66, unit_cost:480, total_value:37440, reorder_point:30, reorder_quantity:60, supplier:'Distribuidora Herramientas Pro', last_restock:'2026-04-10', status:'in_stock' },
  { id:'6', sku:'KAP-NIV-3LG', name:'Nivel Láser 3L Verde 30m', category:'Medición', warehouse:'Almacén Secundario CDMX', quantity:22, reserved:4, available:18, unit_cost:920, total_value:20240, reorder_point:20, reorder_quantity:40, supplier:'Importadora Tools MX', last_restock:'2026-04-25', status:'low_stock' },
  { id:'7', sku:'KAP-ESM-350', name:'Esmeriladora Banco 6" 350W', category:'Herramientas de Banco', warehouse:'Almacén Principal Puebla', quantity:34, reserved:5, available:29, unit_cost:780, total_value:26520, reorder_point:15, reorder_quantity:35, supplier:'Proveedor Industrial Norte', last_restock:'2026-04-30', status:'in_stock' },
  { id:'8', sku:'KAP-LLA-010M', name:'Set Llaves Allen 10pz Métrico', category:'Llaves y Fijadores', warehouse:'Almacén Secundario CDMX', quantity:0, reserved:0, available:0, unit_cost:95, total_value:0, reorder_point:50, reorder_quantity:150, supplier:'Importadora Tools MX', last_restock:'2026-01-15', status:'out_of_stock' },
]

export const mockERPInventoryStats = {
  total_items: 247,
  total_value: 1245678.50,
  in_stock: 189,
  low_stock: 34,
  out_of_stock: 12,
  overstocked: 12,
  warehouses: 3,
}

// ============================================
// ANALYTICS - MOCK DATA
// ============================================

export interface AnalyticsTrendPoint {
  date: string
  sales: number
  orders: number
  avg_ticket: number
}

export interface AnalyticsTopProduct {
  name: string
  sku: string
  units_sold: number
  revenue: number
  growth: number
}

export const mockMLAnalytics = {
  summary: {
    total_sales: 87650,
    total_orders: 234,
    avg_ticket: 374.57,
    conversion_rate: 3.2,
    growth_vs_prev: 12.5,
    total_products: 47,
    active_listings: 42,
  },
  sales_trend: [
    { date: '2026-05-01', sales: 8450,  orders: 24, avg_ticket: 352 },
    { date: '2026-05-02', sales: 9200,  orders: 28, avg_ticket: 329 },
    { date: '2026-05-03', sales: 7800,  orders: 19, avg_ticket: 411 },
    { date: '2026-05-04', sales: 10500, orders: 31, avg_ticket: 339 },
    { date: '2026-05-05', sales: 12300, orders: 35, avg_ticket: 351 },
    { date: '2026-05-06', sales: 11200, orders: 29, avg_ticket: 386 },
    { date: '2026-05-07', sales: 9100,  orders: 22, avg_ticket: 414 },
    { date: '2026-05-08', sales: 10400, orders: 27, avg_ticket: 385 },
    { date: '2026-05-09', sales: 9200,  orders: 23, avg_ticket: 400 },
    { date: '2026-05-10', sales: 9500,  orders: 26, avg_ticket: 365 },
  ] as AnalyticsTrendPoint[],
  top_products: [
    { name: 'Taladro Percutor 800W',     sku: 'KAP-TAL-003', units_sold: 89,  revenue: 115611, growth: 23.5  },
    { name: 'Kit Destornilladores 32pz', sku: 'KAP-KIT-032', units_sold: 234, revenue: 69966,  growth: 45.2  },
    { name: 'Compresor 25L 2HP',         sku: 'KAP-COM-007', units_sold: 34,  revenue: 84966,  growth: 8.7   },
    { name: 'Sierra Circular 1400W',     sku: 'KAP-SIE-140', units_sold: 28,  revenue: 53172,  growth: -5.3  },
    { name: 'Lijadora Orbital 2.4A',     sku: 'KAP-LIJ-450', units_sold: 67,  revenue: 30803,  growth: 67.8  },
  ] as AnalyticsTopProduct[],
  listing_types: [
    { name: 'Premium', value: 45, percentage: 42 },
    { name: 'Clásica', value: 35, percentage: 33 },
    { name: 'Gratis',  value: 27, percentage: 25 },
  ],
  questions_stats: { total: 145, answered: 132, avg_response_time: '2.5 hrs', answer_rate: 91 },
}

export const mockAmazonAnalytics = {
  summary: {
    total_sales: 67543,
    total_orders: 187,
    avg_ticket: 361.20,
    conversion_rate: 4.8,
    growth_vs_prev: 18.3,
    fba_percentage: 73,
    avg_profit_margin: 38.5,
  },
  sales_trend: [
    { date: '2026-05-01', sales: 6200, orders: 18, avg_ticket: 344 },
    { date: '2026-05-02', sales: 7100, orders: 21, avg_ticket: 338 },
    { date: '2026-05-03', sales: 6800, orders: 17, avg_ticket: 400 },
    { date: '2026-05-04', sales: 8200, orders: 24, avg_ticket: 342 },
    { date: '2026-05-05', sales: 9100, orders: 28, avg_ticket: 325 },
    { date: '2026-05-06', sales: 7900, orders: 20, avg_ticket: 395 },
    { date: '2026-05-07', sales: 6500, orders: 16, avg_ticket: 406 },
    { date: '2026-05-08', sales: 7400, orders: 19, avg_ticket: 389 },
    { date: '2026-05-09', sales: 6800, orders: 18, avg_ticket: 378 },
    { date: '2026-05-10', sales: 7543, orders: 20, avg_ticket: 377 },
  ] as AnalyticsTrendPoint[],
  top_products: [
    { name: 'Taladro Percutor 20V',      sku: 'KAP-TAL-003-FBA', units_sold: 67,  revenue: 60267, growth: 34.2  },
    { name: 'Kit Herramientas 128pz',    sku: 'KAP-KIT-105-FBM', units_sold: 145, revenue: 95685, growth: 52.7  },
    { name: 'Compresor Portátil 6 Gal',  sku: 'KAP-COM-007-FBA', units_sold: 23,  revenue: 34500, growth: 15.8  },
    { name: 'Sierra Circular 7-1/4"',    sku: 'KAP-SIE-210-FBA', units_sold: 19,  revenue: 22800, growth: -8.2  },
    { name: 'Lijadora Orbital 14k OPM',  sku: 'KAP-LIJ-450-FBA', units_sold: 89,  revenue: 40930, growth: 78.3  },
  ] as AnalyticsTopProduct[],
  fulfillment_split: [
    { name: 'FBA', value: 73, sales: 49326 },
    { name: 'FBM', value: 27, sales: 18217 },
  ],
  fees: [
    { label: 'Referral',       amount: 8234, pct: 52 },
    { label: 'FBA Fulfil.',    amount: 3109, pct: 31 },
    { label: 'Almacenamiento', amount: 1200, pct: 9  },
    { label: 'AMS',            amount: 1000, pct: 8  },
  ],
}

export const mockShopifyAnalytics = {
  summary: {
    total_sales: 134567,
    total_orders: 287,
    avg_ticket: 468.95,
    conversion_rate: 2.9,
    growth_vs_prev: 25.7,
    total_sessions: 9185,
    abandoned_carts: 145,
  },
  sales_trend: [
    { date: '2026-05-01', sales: 12300, orders: 28, avg_ticket: 439 },
    { date: '2026-05-02', sales: 14100, orders: 32, avg_ticket: 441 },
    { date: '2026-05-03', sales: 11800, orders: 24, avg_ticket: 492 },
    { date: '2026-05-04', sales: 15200, orders: 35, avg_ticket: 434 },
    { date: '2026-05-05', sales: 17500, orders: 39, avg_ticket: 449 },
    { date: '2026-05-06', sales: 14900, orders: 31, avg_ticket: 481 },
    { date: '2026-05-07', sales: 11200, orders: 22, avg_ticket: 509 },
    { date: '2026-05-08', sales: 13400, orders: 27, avg_ticket: 496 },
    { date: '2026-05-09', sales: 12600, orders: 26, avg_ticket: 485 },
    { date: '2026-05-10', sales: 14567, orders: 31, avg_ticket: 470 },
  ] as AnalyticsTrendPoint[],
  top_products: [
    { name: 'Taladro Percutor 800W',     sku: 'KAP-TAL-003', units_sold: 78,  revenue: 101322, growth: 28.9 },
    { name: 'Compresor de Aire 25L',     sku: 'KAP-COM-007', units_sold: 45,  revenue: 112455, growth: 42.3 },
    { name: 'Kit Destornilladores 32pz', sku: 'KAP-KIT-032', units_sold: 189, revenue: 56511,  growth: 67.2 },
    { name: 'Sierra Circular 1400W',     sku: 'KAP-SIE-140', units_sold: 34,  revenue: 64566,  growth: 12.5 },
    { name: 'Lijadora Orbital',          sku: 'KAP-LIJ-450', units_sold: 123, revenue: 56547,  growth: 89.4 },
  ] as AnalyticsTopProduct[],
  traffic_sources: [
    { name: 'Orgánico', sessions: 4523, orders: 87, conversion: 1.9 },
    { name: 'Directo',  sessions: 2145, orders: 76, conversion: 3.5 },
    { name: 'Social',   sessions: 1876, orders: 45, conversion: 2.4 },
    { name: 'Email',    sessions: 987,  orders: 52, conversion: 5.3 },
    { name: 'Referral', sessions: 654,  orders: 27, conversion: 4.1 },
  ],
  cart_recovery: { abandoned: 145, recovered: 38, recovery_rate: 26.2, recovered_revenue: 17845 },
}

// ── ERP FINANCE ────────────────────────────────────────────────────────────────

export const mockFinanceHistory = [
  { month: 'Ene', revenue: 285600, expenses: 175400, profit: 110200 },
  { month: 'Feb', revenue: 298450, expenses: 182300, profit: 116150 },
  { month: 'Mar', revenue: 312890, expenses: 189700, profit: 123190 },
  { month: 'Abr', revenue: 325670, expenses: 195200, profit: 130470 },
  { month: 'May', revenue: 342567, expenses: 198453, profit: 144114 },
]

export const mockFinanceByChannel = [
  { channel: 'ML',      revenue: 128450, pct: 37.5 },
  { channel: 'Amazon',  revenue: 89340,  pct: 26.1 },
  { channel: 'Shopify', revenue: 74230,  pct: 21.7 },
  { channel: 'Directo', revenue: 50547,  pct: 14.7 },
]

export const mockARAging = [
  { range: '0-30d',  amount: 234500, count: 12 },
  { range: '31-60d', amount: 87300,  count: 5  },
  { range: '61-90d', amount: 34200,  count: 3  },
  { range: '>90d',   amount: 12800,  count: 2  },
]

export const mockAPSummary = [
  { supplier: 'Herramientas Bosch MX',   due: '2026-05-15', amount: 48750,  status: 'pending'   as const },
  { supplier: 'Makita Distribuciones',   due: '2026-05-20', amount: 32400,  status: 'pending'   as const },
  { supplier: 'DeWalt Industrial S.A.',  due: '2026-05-10', amount: 19800,  status: 'overdue'   as const },
  { supplier: 'Stanley Black & Decker',  due: '2026-05-25', amount: 28600,  status: 'scheduled' as const },
]

export interface FinanceSnapshot {
  revenue_mtd: number
  expenses_mtd: number
  profit_mtd: number
  profit_margin: number
  ar_total: number
  ap_total: number
  cash_balance: number
  burn_rate: number
  growth_vs_prev: number
}

export const mockFinanceSnapshot: FinanceSnapshot = {
  revenue_mtd:    342567,
  expenses_mtd:   198453,
  profit_mtd:     144114,
  profit_margin:  42.1,
  ar_total:       368800,
  ap_total:       129550,
  cash_balance:   487320,
  burn_rate:      198453,
  growth_vs_prev: 15.4,
}

// ── CRM QUOTES ─────────────────────────────────────────────────────────────────

export interface Quote {
  id: string
  folio: string
  client: string
  rfc: string
  amount: number
  items: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  created_at: string
  expires_at: string
  agent: string
  channel: string
}

export const mockQuotes: Quote[] = [
  { id: 'q1', folio: 'COT-2026-089', client: 'Constructora ABC S.A.',      rfc: 'CAB850101ABC', amount: 87450,  items: 12, status: 'accepted', created_at: '2026-05-01', expires_at: '2026-05-31', agent: 'Ana López',    channel: 'WhatsApp' },
  { id: 'q2', folio: 'COT-2026-090', client: 'Ferretería El Martillo',     rfc: 'FEM920301XYZ', amount: 34200,  items: 6,  status: 'viewed',   created_at: '2026-05-03', expires_at: '2026-06-02', agent: 'Carlos R.',    channel: 'Email'    },
  { id: 'q3', folio: 'COT-2026-091', client: 'Industrias Monterrey S.A.',  rfc: 'IMO780615DEF', amount: 156780, items: 23, status: 'sent',     created_at: '2026-05-05', expires_at: '2026-06-04', agent: 'María G.',     channel: 'Email'    },
  { id: 'q4', folio: 'COT-2026-092', client: 'Grupo Constructor Norte',    rfc: 'GCN910204GHI', amount: 45300,  items: 8,  status: 'draft',    created_at: '2026-05-07', expires_at: '2026-06-06', agent: 'Roberto M.',   channel: 'Directo'  },
  { id: 'q5', folio: 'COT-2026-093', client: 'Tornillos y Perfiles SA',    rfc: 'TYP850722JKL', amount: 23100,  items: 4,  status: 'rejected', created_at: '2026-05-02', expires_at: '2026-05-22', agent: 'Ana López',    channel: 'WhatsApp' },
  { id: 'q6', folio: 'COT-2026-094', client: 'Herramientas Durango S.A.',  rfc: 'HDU930918MNO', amount: 98560,  items: 17, status: 'viewed',   created_at: '2026-05-08', expires_at: '2026-06-07', agent: 'Carlos R.',    channel: 'Email'    },
]

export const mockQuotesStats = {
  total: 6,
  draft: 1,
  sent: 1,
  viewed: 2,
  accepted: 1,
  rejected: 1,
  total_amount: 445390,
  accepted_amount: 87450,
  conversion_rate: 16.7,
  avg_ticket: 74232,
}

// ── CRM LEAD SCORER ────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  source: string
  stage: string
  potential_value: number
  last_activity: string
  days_inactive: number
  engagement: { emails_opened: number; messages_replied: number; site_visits: number }
  scoring_factors: { label: string; score: number; max: number }[]
}

export const mockLeads: Lead[] = [
  {
    id: 'l1', name: 'Ing. Roberto Sánchez', company: 'Constructora Norte S.A.', email: 'r.sanchez@cnorte.mx', phone: '+52 818 234 5678',
    score: 92, grade: 'A', source: 'WhatsApp', stage: 'proposal', potential_value: 245000, last_activity: '2026-05-09', days_inactive: 1,
    engagement: { emails_opened: 8, messages_replied: 12, site_visits: 34 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 25, max: 25 },
      { label: 'Engagement',       score: 28, max: 30 },
      { label: 'Presupuesto',      score: 22, max: 25 },
      { label: 'Timing',           score: 17, max: 20 },
    ],
  },
  {
    id: 'l2', name: 'Lic. Patricia Vera', company: 'Ferretera Central MX', email: 'pvera@fercentral.com', phone: '+52 55 4567 8901',
    score: 78, grade: 'B', source: 'Email', stage: 'qualified', potential_value: 128000, last_activity: '2026-05-07', days_inactive: 3,
    engagement: { emails_opened: 5, messages_replied: 6, site_visits: 18 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 20, max: 25 },
      { label: 'Engagement',       score: 22, max: 30 },
      { label: 'Presupuesto',      score: 20, max: 25 },
      { label: 'Timing',           score: 16, max: 20 },
    ],
  },
  {
    id: 'l3', name: 'Dr. Marcos Fuentes', company: 'Industrias Jalisco S.A.', email: 'm.fuentes@indjalisco.mx', phone: '+52 33 9876 5432',
    score: 85, grade: 'A', source: 'LinkedIn', stage: 'negotiation', potential_value: 380000, last_activity: '2026-05-08', days_inactive: 2,
    engagement: { emails_opened: 11, messages_replied: 9, site_visits: 47 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 24, max: 25 },
      { label: 'Engagement',       score: 26, max: 30 },
      { label: 'Presupuesto',      score: 23, max: 25 },
      { label: 'Timing',           score: 12, max: 20 },
    ],
  },
  {
    id: 'l4', name: 'C.P. Sofía Torres', company: 'Grupo Herramientas del Bajío', email: 's.torres@ghbajio.com', phone: '+52 477 321 0987',
    score: 61, grade: 'C', source: 'Facebook', stage: 'lead', potential_value: 65000, last_activity: '2026-05-04', days_inactive: 6,
    engagement: { emails_opened: 2, messages_replied: 3, site_visits: 9 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 15, max: 25 },
      { label: 'Engagement',       score: 16, max: 30 },
      { label: 'Presupuesto',      score: 16, max: 25 },
      { label: 'Timing',           score: 14, max: 20 },
    ],
  },
  {
    id: 'l5', name: 'Arq. Diego Ramírez', company: 'Constructora del Pacífico', email: 'dramirez@cpac.mx', phone: '+52 669 654 3210',
    score: 44, grade: 'D', source: 'Instagram', stage: 'lead', potential_value: 42000, last_activity: '2026-04-28', days_inactive: 12,
    engagement: { emails_opened: 1, messages_replied: 1, site_visits: 4 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 12, max: 25 },
      { label: 'Engagement',       score: 10, max: 30 },
      { label: 'Presupuesto',      score: 12, max: 25 },
      { label: 'Timing',           score: 10, max: 20 },
    ],
  },
  {
    id: 'l6', name: 'Ing. Carmen Olivares', company: 'Metal Works Monterrey', email: 'c.olivares@mwm.mx', phone: '+52 81 7654 3210',
    score: 73, grade: 'B', source: 'Referral', stage: 'qualified', potential_value: 195000, last_activity: '2026-05-06', days_inactive: 4,
    engagement: { emails_opened: 4, messages_replied: 7, site_visits: 22 },
    scoring_factors: [
      { label: 'Perfil empresa',   score: 19, max: 25 },
      { label: 'Engagement',       score: 20, max: 30 },
      { label: 'Presupuesto',      score: 19, max: 25 },
      { label: 'Timing',           score: 15, max: 20 },
    ],
  },
]

export const mockLeadScoringStats = {
  total_leads: 6,
  grade_a: 2,
  grade_b: 2,
  grade_c: 1,
  grade_d: 1,
  avg_score: 72.2,
  total_potential: 1055000,
  hot_leads: 2,
}

// ── SHOPIFY FULFILLMENT ────────────────────────────────────────────────────────

export interface ShopifyFulfillment {
  id: string
  order_number: number
  status: 'pending' | 'processing' | 'fulfilled' | 'cancelled'
  items: { title: string; sku: string; quantity: number; fulfilled: number }[]
  shipping: { carrier: string; service: string; tracking_number?: string }
  created_at: string
  fulfilled_at?: string
  destination: { name: string; city: string; province: string }
}

export const mockShopifyFulfillments: ShopifyFulfillment[] = [
  {
    id: 'f1', order_number: 1045, status: 'pending',
    items: [
      { title: 'Taladro Percutor 800W',     sku: 'KAP-TAL-003', quantity: 1, fulfilled: 0 },
      { title: 'Kit Destornilladores 32pz', sku: 'KAP-KIT-032', quantity: 2, fulfilled: 0 },
    ],
    shipping: { carrier: 'FedEx', service: 'Express' },
    created_at: '2026-05-10T10:30:00Z',
    destination: { name: 'Juan Pérez', city: 'Puebla', province: 'PUE' },
  },
  {
    id: 'f2', order_number: 1046, status: 'fulfilled',
    items: [{ title: 'Compresor de Aire 25L', sku: 'KAP-COM-007', quantity: 1, fulfilled: 1 }],
    shipping: { carrier: 'DHL', service: 'Standard', tracking_number: 'DHL123456789MX' },
    created_at: '2026-05-10T11:45:00Z',
    fulfilled_at: '2026-05-10T15:30:00Z',
    destination: { name: 'María González', city: 'Cholula', province: 'PUE' },
  },
  {
    id: 'f3', order_number: 1047, status: 'processing',
    items: [
      { title: 'Sierra Circular 1400W',  sku: 'KAP-SIE-140', quantity: 1, fulfilled: 0 },
      { title: 'Disco de Corte x10',     sku: 'KAP-DIS-010', quantity: 1, fulfilled: 0 },
    ],
    shipping: { carrier: 'Estafeta', service: 'Express' },
    created_at: '2026-05-09T14:00:00Z',
    destination: { name: 'Carlos Ramírez', city: 'CDMX', province: 'CDMX' },
  },
  {
    id: 'f4', order_number: 1048, status: 'pending',
    items: [{ title: 'Lijadora Orbital 450W', sku: 'KAP-LIJ-450', quantity: 1, fulfilled: 0 }],
    shipping: { carrier: 'FedEx', service: 'Ground' },
    created_at: '2026-05-10T16:20:00Z',
    destination: { name: 'Ana Torres', city: 'Guadalajara', province: 'JAL' },
  },
  {
    id: 'f5', order_number: 1049, status: 'fulfilled',
    items: [
      { title: 'Nivel Láser 3 Líneas',  sku: 'KAP-NIV-3L',  quantity: 1, fulfilled: 1 },
      { title: 'Cinta Métrica 5m',       sku: 'KAP-CIN-005', quantity: 2, fulfilled: 2 },
    ],
    shipping: { carrier: 'DHL', service: 'Express', tracking_number: 'DHL987654321MX' },
    created_at: '2026-05-08T09:10:00Z',
    fulfilled_at: '2026-05-09T11:00:00Z',
    destination: { name: 'Roberto Soto', city: 'Monterrey', province: 'NL' },
  },
  {
    id: 'f6', order_number: 1050, status: 'cancelled',
    items: [{ title: 'Rotomartillo 1100W', sku: 'KAP-ROT-110', quantity: 1, fulfilled: 0 }],
    shipping: { carrier: 'FedEx', service: 'Express' },
    created_at: '2026-05-09T17:00:00Z',
    destination: { name: 'Lucía Mendoza', city: 'Toluca', province: 'MEX' },
  },
]

export const mockFulfillmentStats = {
  total: 6,
  pending: 2,
  processing: 1,
  fulfilled: 2,
  cancelled: 1,
  fulfillment_rate: 66.7,
  avg_fulfillment_hours: 5.4,
  pending_items: 5,
}

// ── GESTIÓN PRECIOS ────────────────────────────────────────────────────────────

export interface PriceRule {
  id: string
  name: string
  type: 'markup' | 'margin' | 'competitor' | 'dynamic'
  status: 'active' | 'paused'
  products_affected: number
  rule_config: {
    base?: string
    markup_pct?: number
    margin_pct?: number
    min_price?: number
    max_price?: number
  }
  created_at: string
  last_applied: string
}

export const mockPriceRules: PriceRule[] = [
  {
    id: 'pr1', name: 'Markup Estándar Herramientas', type: 'markup', status: 'active',
    products_affected: 127,
    rule_config: { base: 'costo', markup_pct: 45, min_price: 100 },
    created_at: '2026-01-15', last_applied: '2026-05-10T08:00:00Z',
  },
  {
    id: 'pr2', name: 'Margen Premium E-commerce', type: 'margin', status: 'active',
    products_affected: 89,
    rule_config: { base: 'costo', margin_pct: 38, max_price: 5000 },
    created_at: '2026-02-01', last_applied: '2026-05-09T22:00:00Z',
  },
  {
    id: 'pr3', name: 'Competencia Mercado Libre', type: 'competitor', status: 'active',
    products_affected: 54,
    rule_config: { min_price: 199, max_price: 8999 },
    created_at: '2026-03-10', last_applied: '2026-05-10T06:30:00Z',
  },
  {
    id: 'pr4', name: 'Precio Dinámico Amazon', type: 'dynamic', status: 'paused',
    products_affected: 38,
    rule_config: { base: 'buybox', min_price: 299, max_price: 12000 },
    created_at: '2026-04-01', last_applied: '2026-05-07T14:00:00Z',
  },
]

export const mockPriceRulesStats = {
  total_rules: 4,
  active_rules: 3,
  products_covered: 308,
  changes_today: 23,
  avg_margin: 38.2,
  revenue_impact: 14500,
}

export interface PriceChange {
  sku: string
  product_name: string
  channel: string
  old_price: number
  new_price: number
  change_pct: number
  reason: string
  applied_at: string
}

export const mockPriceChanges: PriceChange[] = [
  { sku: 'KAP-TAL-003', product_name: 'Taladro Percutor 800W',     channel: 'Mercado Libre', old_price: 1249, new_price: 1299, change_pct: 4.0,   reason: 'Ajuste competencia', applied_at: '2026-05-10T08:15:00Z' },
  { sku: 'KAP-COM-007', product_name: 'Compresor de Aire 25L',     channel: 'Amazon',        old_price: 2490, new_price: 2399, change_pct: -3.7,  reason: 'Buy Box recovery',  applied_at: '2026-05-10T07:45:00Z' },
  { sku: 'KAP-SIE-140', product_name: 'Sierra Circular 1400W',    channel: 'Shopify',       old_price: 1890, new_price: 1990, change_pct: 5.3,   reason: 'Markup estándar',   applied_at: '2026-05-10T06:30:00Z' },
  { sku: 'KAP-KIT-032', product_name: 'Kit Destornilladores 32pz', channel: 'Mercado Libre', old_price: 299,  new_price: 279,  change_pct: -6.7,  reason: 'Promo flash 24h',   applied_at: '2026-05-09T20:00:00Z' },
  { sku: 'KAP-LIJ-450', product_name: 'Lijadora Orbital 450W',    channel: 'Amazon',        old_price: 459,  new_price: 489,  change_pct: 6.5,   reason: 'Stock bajo',        applied_at: '2026-05-09T18:30:00Z' },
  { sku: 'KAP-NIV-3L',  product_name: 'Nivel Láser 3 Líneas',     channel: 'Shopify',       old_price: 1299, new_price: 1349, change_pct: 3.8,   reason: 'Margen premium',    applied_at: '2026-05-09T17:00:00Z' },
]

// ── META WHATSAPP ──────────────────────────────────────────────────────────────

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  status: 'approved' | 'pending' | 'rejected'
  components: { type: 'header' | 'body' | 'footer' | 'buttons'; content: string; variables?: string[] }[]
  created_at: string
  last_sent?: string
  total_sent: number
}

export interface WhatsAppBroadcast {
  id: string
  name: string
  template_name: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  recipients: number
  sent: number
  delivered: number
  read: number
  replied: number
  failed: number
  scheduled_at?: string
  completed_at?: string
}

export const mockWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: 'wt1', name: 'promocion_herramientas', category: 'marketing', status: 'approved',
    components: [
      { type: 'header',   content: '🛠️ ¡Promoción Especial Kap Tools!' },
      { type: 'body',     content: 'Hola {{1}}, tenemos un {{2}}% de descuento en {{3}}. Válido hasta {{4}}.', variables: ['nombre', 'descuento', 'producto', 'fecha'] },
      { type: 'footer',   content: 'Kap Tools - Herramientas Profesionales' },
      { type: 'buttons',  content: 'Ver Catálogo | Contactar Ventas' },
    ],
    created_at: '2026-04-15', last_sent: '2026-05-08T14:30:00Z', total_sent: 1247,
  },
  {
    id: 'wt2', name: 'confirmacion_pedido', category: 'utility', status: 'approved',
    components: [
      { type: 'header',  content: '✅ Pedido Confirmado' },
      { type: 'body',    content: 'Hola {{1}}, tu pedido #{{2}} fue confirmado. Total: ${{3}} MXN. Entrega: {{4}}.', variables: ['nombre', 'orden', 'total', 'fecha_entrega'] },
      { type: 'footer',  content: 'Gracias por tu compra' },
      { type: 'buttons', content: 'Rastrear Pedido' },
    ],
    created_at: '2026-03-20', last_sent: '2026-05-10T16:45:00Z', total_sent: 2891,
  },
  {
    id: 'wt3', name: 'recordatorio_carrito', category: 'marketing', status: 'approved',
    components: [
      { type: 'header',  content: '🛒 Tienes productos en tu carrito' },
      { type: 'body',    content: 'Hola {{1}}, dejaste {{2}} producto(s) por ${{3}}. ¡Completa tu compra!', variables: ['nombre', 'cantidad', 'total'] },
      { type: 'buttons', content: 'Completar Compra' },
    ],
    created_at: '2026-04-01', last_sent: '2026-05-09T11:20:00Z', total_sent: 567,
  },
  {
    id: 'wt4', name: 'seguimiento_entrega', category: 'utility', status: 'approved',
    components: [
      { type: 'header',  content: '📦 Tu pedido está en camino' },
      { type: 'body',    content: 'Hola {{1}}, tu pedido #{{2}} sale hoy. Número de guía: {{3}}.', variables: ['nombre', 'orden', 'guia'] },
      { type: 'buttons', content: 'Rastrear en Tiempo Real' },
    ],
    created_at: '2026-04-10', last_sent: '2026-05-10T09:00:00Z', total_sent: 1834,
  },
  {
    id: 'wt5', name: 'cotizacion_b2b', category: 'marketing', status: 'pending',
    components: [
      { type: 'header', content: '📋 Cotización Lista' },
      { type: 'body',   content: 'Hola {{1}}, tu cotización {{2}} por ${{3}} MXN está lista. Válida 15 días.', variables: ['nombre', 'folio', 'monto'] },
    ],
    created_at: '2026-05-08', total_sent: 0,
  },
]

export const mockWhatsAppBroadcasts: WhatsAppBroadcast[] = [
  {
    id: 'wb1', name: 'Promo Mayo 2026 — Taladros', template_name: 'promocion_herramientas',
    status: 'completed', recipients: 1500, sent: 1500, delivered: 1487, read: 1234, replied: 187, failed: 13,
    scheduled_at: '2026-05-01T08:00:00Z', completed_at: '2026-05-01T09:30:00Z',
  },
  {
    id: 'wb2', name: 'Recordatorio Carritos Abandonados', template_name: 'recordatorio_carrito',
    status: 'scheduled', recipients: 234, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0,
    scheduled_at: '2026-05-11T10:00:00Z',
  },
  {
    id: 'wb3', name: 'Confirmaciones Pedidos Semana', template_name: 'confirmacion_pedido',
    status: 'completed', recipients: 89, sent: 89, delivered: 88, read: 82, replied: 14, failed: 1,
    scheduled_at: '2026-05-05T08:00:00Z', completed_at: '2026-05-05T08:15:00Z',
  },
  {
    id: 'wb4', name: 'Seguimiento Entregas DHL', template_name: 'seguimiento_entrega',
    status: 'sending', recipients: 312, sent: 245, delivered: 240, read: 198, replied: 23, failed: 5,
  },
]

export const mockWhatsAppStats = {
  total_templates: 5,
  approved: 4,
  pending: 1,
  total_broadcasts: 4,
  messages_sent_month: 8945,
  avg_delivery_rate: 98.5,
  avg_read_rate: 82.3,
  avg_reply_rate: 12.4,
}

// ── META INSTAGRAM ─────────────────────────────────────────────────────────────

export interface InstagramPost {
  id: string
  type: 'photo' | 'carousel' | 'reel' | 'story'
  caption: string
  status: 'published' | 'scheduled' | 'draft'
  created_at: string
  published_at?: string
  scheduled_at?: string
  insights: { impressions: number; reach: number; likes: number; comments: number; shares: number; saves: number; engagement_rate: number }
}

export interface InstagramAd {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  objective: 'awareness' | 'traffic' | 'engagement' | 'conversions'
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  start_date: string
  end_date: string
}

export const mockInstagramPosts: InstagramPost[] = [
  {
    id: 'ig1', type: 'photo', caption: '🛠️ Nueva llegada: Taladro Percutor 800W ⚡\n✅ 2 velocidades ✅ Mandril 13mm\n#KapTools #Herramientas',
    status: 'published', created_at: '2026-05-08T10:00:00Z', published_at: '2026-05-08T10:00:00Z',
    insights: { impressions: 4523, reach: 3891, likes: 287, comments: 34, shares: 12, saves: 45, engagement_rate: 8.3 },
  },
  {
    id: 'ig2', type: 'reel', caption: '⚡ Compresor en acción! Mira qué rápido infla 🚗💨\n25L | 2HP | Profesional\n#Compresor #KapTools',
    status: 'published', created_at: '2026-05-06T14:30:00Z', published_at: '2026-05-06T14:30:00Z',
    insights: { impressions: 12456, reach: 9823, likes: 892, comments: 67, shares: 134, saves: 234, engagement_rate: 13.4 },
  },
  {
    id: 'ig3', type: 'carousel', caption: '📦 Kit Destornilladores 32pz\nSwipe para ver todo ➡️\n#ToolKit #KapTools',
    status: 'scheduled', created_at: '2026-05-10T11:00:00Z', scheduled_at: '2026-05-11T12:00:00Z',
    insights: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement_rate: 0 },
  },
  {
    id: 'ig4', type: 'photo', caption: '🏆 Clientes satisfechos en toda la República\n¡Más de 10,000 pedidos exitosos! 🙌\n#KapTools',
    status: 'published', created_at: '2026-05-04T09:00:00Z', published_at: '2026-05-04T09:00:00Z',
    insights: { impressions: 6789, reach: 5234, likes: 412, comments: 56, shares: 28, saves: 89, engagement_rate: 11.1 },
  },
  {
    id: 'ig5', type: 'story', caption: '⏰ ÚLTIMAS HORAS — Sierra Circular 20% OFF',
    status: 'draft', created_at: '2026-05-10T16:00:00Z',
    insights: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagement_rate: 0 },
  },
]

export const mockInstagramAds: InstagramAd[] = [
  {
    id: 'ia1', name: 'Campaña Taladros — Conversión', status: 'active', objective: 'conversions',
    budget: 5000, spent: 3245.67, impressions: 45678, clicks: 1234, ctr: 2.7, cpc: 2.63, conversions: 89,
    start_date: '2026-05-01', end_date: '2026-05-31',
  },
  {
    id: 'ia2', name: 'Awareness — Marca Kap Tools', status: 'active', objective: 'awareness',
    budget: 3000, spent: 2156.34, impressions: 123456, clicks: 2345, ctr: 1.9, cpc: 0.92, conversions: 0,
    start_date: '2026-05-01', end_date: '2026-05-15',
  },
  {
    id: 'ia3', name: 'Tráfico Blog — Compresores', status: 'paused', objective: 'traffic',
    budget: 1500, spent: 892.10, impressions: 23456, clicks: 567, ctr: 2.4, cpc: 1.57, conversions: 0,
    start_date: '2026-05-05', end_date: '2026-05-20',
  },
]

export const mockInstagramStats = {
  followers: 12456,
  posts: 187,
  avg_engagement_rate: 9.2,
  impressions_month: 234567,
  reach_month: 189234,
  profile_visits: 4567,
  website_clicks: 1234,
  top_post_type: 'Reels',
}

// ── META FACEBOOK ──────────────────────────────────────────────────────────────

export interface FacebookPost {
  id: string
  message: string
  type: 'status' | 'photo' | 'video' | 'link'
  status: 'published' | 'scheduled' | 'draft'
  created_at: string
  published_at?: string
  scheduled_at?: string
  insights: { impressions: number; reach: number; reactions: number; comments: number; shares: number; clicks: number; engagement_rate: number }
}

export interface FacebookAd {
  id: string
  name: string
  campaign_name: string
  status: 'active' | 'paused' | 'completed'
  objective: 'awareness' | 'traffic' | 'leads' | 'sales'
  budget_daily: number
  spent: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cost_per_conversion: number
  start_date: string
  end_date?: string
}

export const mockFacebookPosts: FacebookPost[] = [
  {
    id: 'fb1', message: '🔥 PROMOCIÓN RELÁMPAGO 🔥\nTaladro Percutor 800W + 2 Baterías\n$1,299 MXN (Antes $1,599) ✅ Envío gratis ✅ Garantía 2 años',
    type: 'photo', status: 'published', created_at: '2026-05-09T09:00:00Z', published_at: '2026-05-09T09:00:00Z',
    insights: { impressions: 8945, reach: 6734, reactions: 234, comments: 45, shares: 28, clicks: 167, engagement_rate: 7.1 },
  },
  {
    id: 'fb2', message: '🎥 VIDEO: Cómo elegir el compresor perfecto para tu taller\n👉 Tips profesionales | Comparativa | Recomendaciones',
    type: 'video', status: 'published', created_at: '2026-05-07T15:00:00Z', published_at: '2026-05-07T15:00:00Z',
    insights: { impressions: 15678, reach: 12345, reactions: 456, comments: 89, shares: 67, clicks: 234, engagement_rate: 10.2 },
  },
  {
    id: 'fb3', message: '📢 "10 Herramientas Esenciales para Todo Profesional de la Construcción"\nLee el artículo completo en nuestro sitio web 👇',
    type: 'link', status: 'scheduled', created_at: '2026-05-10T10:00:00Z', scheduled_at: '2026-05-11T08:00:00Z',
    insights: { impressions: 0, reach: 0, reactions: 0, comments: 0, shares: 0, clicks: 0, engagement_rate: 0 },
  },
  {
    id: 'fb4', message: '🏅 ¡Kap Tools cumple 5 años en e-commerce!\nGracias a todos nuestros clientes por su confianza 🙏',
    type: 'photo', status: 'published', created_at: '2026-05-05T12:00:00Z', published_at: '2026-05-05T12:00:00Z',
    insights: { impressions: 22456, reach: 18234, reactions: 892, comments: 134, shares: 156, clicks: 345, engagement_rate: 12.3 },
  },
]

export const mockFacebookAds: FacebookAd[] = [
  {
    id: 'fa1', name: 'Conversión — Taladros Premium', campaign_name: 'Mayo 2026 — Power Tools',
    status: 'active', objective: 'sales', budget_daily: 300, spent: 2456.78,
    impressions: 67890, clicks: 1567, ctr: 2.3, cpc: 1.57, conversions: 45, cost_per_conversion: 54.59,
    start_date: '2026-05-01', end_date: '2026-05-31',
  },
  {
    id: 'fa2', name: 'Leads — Cotización B2B', campaign_name: 'Lead Generation — Empresas',
    status: 'active', objective: 'leads', budget_daily: 150, spent: 1234.56,
    impressions: 34567, clicks: 678, ctr: 2.0, cpc: 1.82, conversions: 23, cost_per_conversion: 53.68,
    start_date: '2026-05-05', end_date: '2026-05-20',
  },
  {
    id: 'fa3', name: 'Tráfico — Blog Herramientas', campaign_name: 'Content Marketing',
    status: 'paused', objective: 'traffic', budget_daily: 100, spent: 567.34,
    impressions: 18934, clicks: 456, ctr: 2.4, cpc: 1.24, conversions: 0, cost_per_conversion: 0,
    start_date: '2026-05-03',
  },
]

export const mockFacebookStats = {
  page_likes: 8934,
  page_followers: 9156,
  posts_month: 28,
  avg_engagement_rate: 8.5,
  impressions_month: 345678,
  reach_month: 267890,
  page_views: 5678,
  messages_received: 234,
}

// ── CONFIG USUARIOS ────────────────────────────────────────────────────────────

type ModulePerms = { view: boolean; edit: boolean; manage: boolean }

export interface User {
  id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'invited'
  avatar_initials: string
  created_at: string
  last_login?: string
  permissions: {
    ecommerce: ModulePerms
    crm:       ModulePerms
    erp:       ModulePerms
    meta:      ModulePerms
    settings:  ModulePerms
  }
}

export interface Role {
  id: string
  name: string
  description: string
  users_count: number
  permissions: {
    ecommerce: ModulePerms
    crm:       ModulePerms
    erp:       ModulePerms
    meta:      ModulePerms
    settings:  ModulePerms
  }
}

const ALL:  ModulePerms = { view: true,  edit: true,  manage: true  }
const EDIT: ModulePerms = { view: true,  edit: true,  manage: false }
const VIEW: ModulePerms = { view: true,  edit: false, manage: false }
const NONE: ModulePerms = { view: false, edit: false, manage: false }

export const mockUsers: User[] = [
  {
    id: 'u1', email: 'admin@kaptools.com.mx', full_name: 'Carlos Cortés',
    role: 'owner', status: 'active', avatar_initials: 'CC',
    created_at: '2025-12-01', last_login: '2026-05-10T09:30:00Z',
    permissions: { ecommerce: ALL, crm: ALL, erp: ALL, meta: ALL, settings: ALL },
  },
  {
    id: 'u2', email: 'ventas@kaptools.com.mx', full_name: 'Laura Méndez',
    role: 'admin', status: 'active', avatar_initials: 'LM',
    created_at: '2026-01-15', last_login: '2026-05-10T11:45:00Z',
    permissions: { ecommerce: ALL, crm: ALL, erp: EDIT, meta: EDIT, settings: VIEW },
  },
  {
    id: 'u3', email: 'almacen@kaptools.com.mx', full_name: 'Roberto Silva',
    role: 'manager', status: 'active', avatar_initials: 'RS',
    created_at: '2026-02-10', last_login: '2026-05-09T16:20:00Z',
    permissions: { ecommerce: EDIT, crm: VIEW, erp: EDIT, meta: NONE, settings: NONE },
  },
  {
    id: 'u4', email: 'marketing@kaptools.com.mx', full_name: 'Ana Patricia Rivas',
    role: 'user', status: 'active', avatar_initials: 'AR',
    created_at: '2026-03-05', last_login: '2026-05-10T08:15:00Z',
    permissions: { ecommerce: VIEW, crm: EDIT, erp: NONE, meta: EDIT, settings: NONE },
  },
  {
    id: 'u5', email: 'contabilidad@kaptools.com.mx', full_name: 'Miguel Torres',
    role: 'user', status: 'invited', avatar_initials: 'MT',
    created_at: '2026-05-08',
    permissions: { ecommerce: VIEW, crm: NONE, erp: EDIT, meta: NONE, settings: NONE },
  },
  {
    id: 'u6', email: 'soporte@kaptools.com.mx', full_name: 'Sofía Herrera',
    role: 'viewer', status: 'active', avatar_initials: 'SH',
    created_at: '2026-04-01', last_login: '2026-05-08T14:00:00Z',
    permissions: { ecommerce: VIEW, crm: VIEW, erp: VIEW, meta: VIEW, settings: NONE },
  },
]

export const mockRoles: Role[] = [
  {
    id: 'r1', name: 'Owner', description: 'Acceso completo a todas las funciones', users_count: 1,
    permissions: { ecommerce: ALL, crm: ALL, erp: ALL, meta: ALL, settings: ALL },
  },
  {
    id: 'r2', name: 'Admin', description: 'Administrador con gestión de módulos', users_count: 2,
    permissions: { ecommerce: ALL, crm: ALL, erp: EDIT, meta: EDIT, settings: VIEW },
  },
  {
    id: 'r3', name: 'Manager', description: 'Gerente de operaciones con edición', users_count: 3,
    permissions: { ecommerce: EDIT, crm: VIEW, erp: EDIT, meta: NONE, settings: NONE },
  },
  {
    id: 'r4', name: 'User', description: 'Usuario estándar con acceso limitado', users_count: 5,
    permissions: { ecommerce: VIEW, crm: EDIT, erp: NONE, meta: VIEW, settings: NONE },
  },
  {
    id: 'r5', name: 'Viewer', description: 'Solo lectura en todos los módulos', users_count: 2,
    permissions: { ecommerce: VIEW, crm: VIEW, erp: VIEW, meta: VIEW, settings: NONE },
  },
]

export const mockUserStats = {
  total: 6,
  active: 4,
  invited: 1,
  inactive: 1,
  by_role: { owner: 1, admin: 1, manager: 1, user: 2, viewer: 1 },
}

// ── ML Catalog ────────────────────────────────────────────────────────────────

export interface MLCatalogItem {
  id: string; catalog_id: string; title: string; category: string
  brand: string; price: number; sold_quantity: number; visits: number
  conversion: number; status: 'active' | 'paused' | 'inactive'; health_score: number
}

export const mockMLCatalog: MLCatalogItem[] = [
  { id: 'c1', catalog_id: 'MLA123456789', title: 'Tensiómetro Digital Brazo OMRON HEM-7156', category: 'Salud', brand: 'OMRON', price: 1299, sold_quantity: 234, visits: 4502, conversion: 5.2, status: 'active', health_score: 92 },
  { id: 'c2', catalog_id: 'MLA987654321', title: 'Oxímetro de Pulso Portátil CMS50D', category: 'Salud', brand: 'Contec', price: 549, sold_quantity: 891, visits: 12300, conversion: 7.2, status: 'active', health_score: 88 },
  { id: 'c3', catalog_id: 'MLA456789123', title: 'Glucómetro FreeStyle Lite Abbott', category: 'Diabetología', brand: 'Abbott', price: 799, sold_quantity: 156, visits: 2890, conversion: 5.4, status: 'active', health_score: 76 },
  { id: 'c4', catalog_id: 'MLA321654987', title: 'Nebulizador Compacto NEB-200 Beurer', category: 'Respiratorio', brand: 'Beurer', price: 1850, sold_quantity: 67, visits: 1450, conversion: 4.6, status: 'paused', health_score: 61 },
  { id: 'c5', catalog_id: 'MLA654321789', title: 'Termómetro Infrarrojo Frente Digital', category: 'Diagnóstico', brand: 'Reer', price: 399, sold_quantity: 1203, visits: 18900, conversion: 6.4, status: 'active', health_score: 95 },
  { id: 'c6', catalog_id: 'MLA789123456', title: 'Estetoscopio Doble Campana 3M Littmann', category: 'Diagnóstico', brand: '3M', price: 2300, sold_quantity: 42, visits: 980, conversion: 4.3, status: 'active', health_score: 84 },
]

export const mockMLCatalogStats = { total: 6, active: 4, paused: 1, inactive: 1, avg_health: 82.7, total_visits: 41022 }

// ── ML Promotions ─────────────────────────────────────────────────────────────

export interface MLPromotion {
  id: string; title: string; type: 'classic' | 'deal_day' | 'discount' | 'combo'
  discount_pct: number; start_date: string; end_date: string
  status: 'active' | 'scheduled' | 'ended'; products_count: number; sales_lift: number
}

export const mockMLPromotions: MLPromotion[] = [
  { id: 'p1', title: 'Semana de la Salud — Oxímetros', type: 'deal_day', discount_pct: 20, start_date: '2026-05-10', end_date: '2026-05-17', status: 'active', products_count: 4, sales_lift: 142 },
  { id: 'p2', title: 'Descuento Tensiómetros 15%', type: 'discount', discount_pct: 15, start_date: '2026-05-15', end_date: '2026-05-31', status: 'scheduled', products_count: 2, sales_lift: 0 },
  { id: 'p3', title: 'Combo Diagnóstico Básico', type: 'combo', discount_pct: 10, start_date: '2026-04-01', end_date: '2026-04-30', status: 'ended', products_count: 3, sales_lift: 78 },
  { id: 'p4', title: 'Flash Sale Termómetros', type: 'classic', discount_pct: 25, start_date: '2026-05-12', end_date: '2026-05-14', status: 'active', products_count: 1, sales_lift: 310 },
]

export const mockMLPromotionStats = { active: 2, scheduled: 1, ended: 1, avg_lift: 176, total_products: 10 }

// ── Amazon Advertising ────────────────────────────────────────────────────────

export interface AmazonCampaign {
  id: string; name: string; type: 'SP' | 'SB' | 'SD'
  status: 'enabled' | 'paused' | 'archived'; budget: number; spend: number
  impressions: number; clicks: number; acos: number; roas: number; sales: number
}

export const mockAmazonCampaigns: AmazonCampaign[] = [
  { id: 'ac1', name: 'SP - Tensiómetros Exact Match', type: 'SP', status: 'enabled', budget: 500, spend: 312.40, impressions: 28400, clicks: 892, acos: 18.2, roas: 5.49, sales: 1716 },
  { id: 'ac2', name: 'SB - Marca KapTools Medical', type: 'SB', status: 'enabled', budget: 300, spend: 201.80, impressions: 54200, clicks: 1203, acos: 22.4, roas: 4.46, sales: 900 },
  { id: 'ac3', name: 'SP - Oxímetros Broad', type: 'SP', status: 'enabled', budget: 400, spend: 389.10, impressions: 61000, clicks: 2140, acos: 31.5, roas: 3.17, sales: 1235 },
  { id: 'ac4', name: 'SD - Retargeting Visitantes', type: 'SD', status: 'paused', budget: 200, spend: 0, impressions: 0, clicks: 0, acos: 0, roas: 0, sales: 0 },
  { id: 'ac5', name: 'SP - Glucómetros Auto', type: 'SP', status: 'enabled', budget: 350, spend: 278.60, impressions: 19800, clicks: 641, acos: 25.1, roas: 3.98, sales: 1110 },
]

export const mockAmazonAdStats = { total_spend: 1181.90, total_sales: 4961, avg_acos: 24.3, avg_roas: 4.12, total_impressions: 163400, total_clicks: 4876 }

// ── Amazon Reports ────────────────────────────────────────────────────────────

export interface AmazonReport {
  id: string; name: string; type: string; period: string
  status: 'ready' | 'processing' | 'failed'; generated_at: string; size_kb: number
}

export const mockAmazonReports: AmazonReport[] = [
  { id: 'ar1', name: 'Reporte de Ventas — Abril 2026', type: 'Sales', period: '2026-04', status: 'ready', generated_at: '2026-05-01T08:00:00Z', size_kb: 142 },
  { id: 'ar2', name: 'Inventario FBA — Semana 19', type: 'Inventory', period: '2026-W19', status: 'ready', generated_at: '2026-05-11T06:00:00Z', size_kb: 89 },
  { id: 'ar3', name: 'Rendimiento Publicidad — Mayo 2026', type: 'Advertising', period: '2026-05', status: 'processing', generated_at: '', size_kb: 0 },
  { id: 'ar4', name: 'Devoluciones — Q1 2026', type: 'Returns', period: '2026-Q1', status: 'ready', generated_at: '2026-04-05T10:30:00Z', size_kb: 56 },
  { id: 'ar5', name: 'Reseñas y Ratings — Abril', type: 'Reviews', period: '2026-04', status: 'ready', generated_at: '2026-05-02T09:00:00Z', size_kb: 34 },
]

export const mockAmazonReportStats = { ready: 4, processing: 1, failed: 0, total_size_kb: 321 }

// ── Shopify Collections ───────────────────────────────────────────────────────

export interface ShopifyCollection {
  id: string; title: string; type: 'manual' | 'smart'; products_count: number
  published: boolean; sort_order: string; revenue_30d: number; orders_30d: number
}

export const mockShopifyCollections: ShopifyCollection[] = [
  { id: 'sc1', title: 'Diagnóstico y Monitoreo', type: 'smart', products_count: 18, published: true, sort_order: 'best-selling', revenue_30d: 48200, orders_30d: 134 },
  { id: 'sc2', title: 'Equipos para el Hogar', type: 'smart', products_count: 12, published: true, sort_order: 'price-asc', revenue_30d: 31500, orders_30d: 89 },
  { id: 'sc3', title: 'Promociones Mayo', type: 'manual', products_count: 6, published: true, sort_order: 'manual', revenue_30d: 12300, orders_30d: 41 },
  { id: 'sc4', title: 'Productos Premium', type: 'manual', products_count: 8, published: false, sort_order: 'manual', revenue_30d: 0, orders_30d: 0 },
  { id: 'sc5', title: 'Diabetología', type: 'smart', products_count: 9, published: true, sort_order: 'created-desc', revenue_30d: 22100, orders_30d: 63 },
]

export const mockShopifyCollectionStats = { total: 5, published: 4, smart: 3, manual: 2, total_revenue_30d: 114100 }

// ── Shopify Discounts ─────────────────────────────────────────────────────────

export interface ShopifyDiscount {
  id: string; code: string; type: 'percentage' | 'fixed' | 'free_shipping' | 'bxgy'
  value: number; usage_count: number; usage_limit: number | null
  status: 'active' | 'expired' | 'scheduled'; starts_at: string; ends_at: string | null; total_saved: number
}

export const mockShopifyDiscounts: ShopifyDiscount[] = [
  { id: 'sd1', code: 'SALUD20', type: 'percentage', value: 20, usage_count: 89, usage_limit: 500, status: 'active', starts_at: '2026-05-01', ends_at: '2026-05-31', total_saved: 8420 },
  { id: 'sd2', code: 'ENVIO0', type: 'free_shipping', value: 0, usage_count: 234, usage_limit: null, status: 'active', starts_at: '2026-05-01', ends_at: null, total_saved: 11700 },
  { id: 'sd3', code: 'KAPTOOLS15', type: 'percentage', value: 15, usage_count: 12, usage_limit: 100, status: 'active', starts_at: '2026-04-15', ends_at: null, total_saved: 3210 },
  { id: 'sd4', code: 'ABRIL10', type: 'fixed', value: 100, usage_count: 67, usage_limit: 200, status: 'expired', starts_at: '2026-04-01', ends_at: '2026-04-30', total_saved: 6700 },
  { id: 'sd5', code: 'VERANO2026', type: 'percentage', value: 25, usage_count: 0, usage_limit: 300, status: 'scheduled', starts_at: '2026-06-01', ends_at: '2026-06-30', total_saved: 0 },
]

export const mockShopifyDiscountStats = { active: 3, expired: 1, scheduled: 1, total_usage: 402, total_saved: 30030 }

// ── Multi-Channel Inventory ───────────────────────────────────────────────────

export interface MCInventoryItem {
  id: string; sku: string; title: string; total_stock: number
  ml_stock: number; amazon_stock: number; shopify_stock: number; warehouse_stock: number
  status: 'ok' | 'low' | 'critical' | 'out'; reorder_point: number; cost: number
}

export const mockMCInventory: MCInventoryItem[] = [
  { id: 'mi1', sku: 'ORG-TEN-001', title: 'Tensiómetro Digital OMRON HEM-7156', total_stock: 148, ml_stock: 40, amazon_stock: 35, shopify_stock: 25, warehouse_stock: 48, status: 'ok', reorder_point: 30, cost: 680 },
  { id: 'mi2', sku: 'ORG-OXI-002', title: 'Oxímetro Portátil CMS50D', total_stock: 312, ml_stock: 80, amazon_stock: 90, shopify_stock: 60, warehouse_stock: 82, status: 'ok', reorder_point: 50, cost: 210 },
  { id: 'mi3', sku: 'ORG-GLU-003', title: 'Glucómetro FreeStyle Lite', total_stock: 28, ml_stock: 8, amazon_stock: 10, shopify_stock: 5, warehouse_stock: 5, status: 'low', reorder_point: 40, cost: 380 },
  { id: 'mi4', sku: 'ORG-NEB-004', title: 'Nebulizador Compacto NEB-200', total_stock: 6, ml_stock: 2, amazon_stock: 2, shopify_stock: 1, warehouse_stock: 1, status: 'critical', reorder_point: 20, cost: 920 },
  { id: 'mi5', sku: 'ORG-TER-005', title: 'Termómetro Infrarrojo Digital', total_stock: 0, ml_stock: 0, amazon_stock: 0, shopify_stock: 0, warehouse_stock: 0, status: 'out', reorder_point: 60, cost: 145 },
  { id: 'mi6', sku: 'ORG-EST-006', title: 'Estetoscopio 3M Littmann', total_stock: 54, ml_stock: 12, amazon_stock: 15, shopify_stock: 10, warehouse_stock: 17, status: 'ok', reorder_point: 15, cost: 1100 },
]

export const mockMCInventoryStats = { total_skus: 6, ok: 3, low: 1, critical: 1, out: 1, total_value: 312400 }

// ── Price Optimization ────────────────────────────────────────────────────────

export interface PriceOptSuggestion {
  id: string; sku: string; title: string; current_price: number; suggested_price: number
  competitor_avg: number; channel: 'ml' | 'amazon' | 'shopify' | 'all'
  reason: string; impact: 'high' | 'medium' | 'low'; potential_gain: number
}

export const mockPriceOptSuggestions: PriceOptSuggestion[] = [
  { id: 'po1', sku: 'ORG-OXI-002', title: 'Oxímetro Portátil CMS50D', current_price: 549, suggested_price: 499, competitor_avg: 489, channel: 'ml', reason: 'Competidores 10% más bajos — bajar precio aumenta Buy Box', impact: 'high', potential_gain: 4200 },
  { id: 'po2', sku: 'ORG-TER-005', title: 'Termómetro Infrarrojo Digital', current_price: 399, suggested_price: 449, competitor_avg: 460, channel: 'amazon', reason: 'Margen bajo vs. competencia — oportunidad de subir precio', impact: 'medium', potential_gain: 1800 },
  { id: 'po3', sku: 'ORG-TEN-001', title: 'Tensiómetro Digital OMRON HEM-7156', current_price: 1299, suggested_price: 1199, competitor_avg: 1180, channel: 'all', reason: 'Precio 10% sobre promedio; reducir mejora conversión', impact: 'high', potential_gain: 6500 },
  { id: 'po4', sku: 'ORG-GLU-003', title: 'Glucómetro FreeStyle Lite', current_price: 799, suggested_price: 749, competitor_avg: 740, channel: 'shopify', reason: 'Ajuste menor para igualar competencia en tienda propia', impact: 'low', potential_gain: 800 },
]

export const mockPriceOptStats = { suggestions: 4, high_impact: 2, medium_impact: 1, low_impact: 1, total_potential_gain: 13300 }

// ── Email Campaigns ───────────────────────────────────────────────────────────

export interface EmailCampaign {
  id: string; subject: string; segment: string
  status: 'sent' | 'draft' | 'scheduled' | 'sending'
  sent_count: number; open_rate: number; click_rate: number; revenue: number; sent_at: string | null
}

export const mockEmailCampaigns: EmailCampaign[] = [
  { id: 'ec1', subject: 'Semana de la Salud — Descuentos exclusivos', segment: 'Todos los clientes', status: 'sent', sent_count: 2340, open_rate: 28.4, click_rate: 6.2, revenue: 18400, sent_at: '2026-05-10T10:00:00Z' },
  { id: 'ec2', subject: 'Tu oxímetro tiene reposición 🎉', segment: 'Compradores Oxímetros', status: 'sent', sent_count: 891, open_rate: 42.1, click_rate: 12.8, revenue: 9800, sent_at: '2026-05-08T09:00:00Z' },
  { id: 'ec3', subject: 'Nuevos equipos de diagnóstico disponibles', segment: 'Clientes Premium', status: 'scheduled', sent_count: 0, open_rate: 0, click_rate: 0, revenue: 0, sent_at: '2026-05-15T11:00:00Z' },
  { id: 'ec4', subject: 'Bienvenida a KapTools Medical', segment: 'Nuevos registros', status: 'draft', sent_count: 0, open_rate: 0, click_rate: 0, revenue: 0, sent_at: null },
  { id: 'ec5', subject: '¿Cómo va tu tensiómetro? Revisión de 6 meses', segment: 'Compradores OMRON', status: 'sent', sent_count: 234, open_rate: 51.3, click_rate: 8.9, revenue: 4200, sent_at: '2026-05-05T14:00:00Z' },
]

export const mockEmailCampaignStats = { total: 5, sent: 3, draft: 1, scheduled: 1, avg_open_rate: 40.6, avg_click_rate: 9.3, total_revenue: 32400 }

// ── Customer Segments ─────────────────────────────────────────────────────────

export interface CustomerSegment {
  id: string; name: string; description: string; customers_count: number
  avg_ltv: number; avg_orders: number; churn_risk: 'low' | 'medium' | 'high'
  last_updated: string; color: string
}

export const mockCustomerSegments: CustomerSegment[] = [
  { id: 'cs1', name: 'Clientes VIP', description: 'Compras > $5,000 en los últimos 6 meses', customers_count: 124, avg_ltv: 12400, avg_orders: 8.2, churn_risk: 'low', last_updated: '2026-05-12', color: '#CCFF00' },
  { id: 'cs2', name: 'Compradores Frecuentes', description: '3+ órdenes en los últimos 90 días', customers_count: 389, avg_ltv: 4800, avg_orders: 4.1, churn_risk: 'low', last_updated: '2026-05-12', color: '#a78bfa' },
  { id: 'cs3', name: 'En Riesgo', description: 'Sin compra en 60-90 días', customers_count: 212, avg_ltv: 2100, avg_orders: 1.8, churn_risk: 'high', last_updated: '2026-05-12', color: '#f87171' },
  { id: 'cs4', name: 'Nuevos Clientes', description: 'Primera compra en los últimos 30 días', customers_count: 156, avg_ltv: 890, avg_orders: 1.0, churn_risk: 'medium', last_updated: '2026-05-12', color: '#60a5fa' },
  { id: 'cs5', name: 'Compradores B2B', description: 'Pedidos mayoreo o factura empresarial', customers_count: 67, avg_ltv: 28900, avg_orders: 12.4, churn_risk: 'low', last_updated: '2026-05-12', color: '#fb923c' },
  { id: 'cs6', name: 'Inactivos', description: 'Sin actividad hace más de 90 días', customers_count: 478, avg_ltv: 1200, avg_orders: 1.2, churn_risk: 'high', last_updated: '2026-05-12', color: '#6b7280' },
]

export const mockCustomerSegmentStats = { total_segments: 6, total_customers: 1426, avg_ltv: 8382, high_risk_count: 690 }

// ── Deal Automation ───────────────────────────────────────────────────────────

export interface DealAutomation {
  id: string; name: string
  trigger: { type: 'stage_change' | 'time_based' | 'value_threshold' | 'activity'; condition: string }
  actions: Array<{ type: 'email' | 'task' | 'notification' | 'webhook' | 'field_update'; label: string }>
  status: 'active' | 'paused'; deals_affected: number; success_rate: number; created_at: string
}

export const mockDealAutomations: DealAutomation[] = [
  { id: 'auto1', name: 'Auto-asignar a ventas cuando calificado', trigger: { type: 'stage_change', condition: 'stage = qualified' }, actions: [{ type: 'task', label: 'Crear tarea "Llamar lead"' }, { type: 'email', label: 'Email seguimiento calificado' }], status: 'active', deals_affected: 234, success_rate: 87.5, created_at: '2026-03-15T10:00:00Z' },
  { id: 'auto2', name: 'Alerta deals estancados >7 días', trigger: { type: 'time_based', condition: 'no_activity_days > 7' }, actions: [{ type: 'notification', label: 'Notificar al owner' }, { type: 'task', label: 'Crear tarea follow-up urgente' }], status: 'active', deals_affected: 67, success_rate: 92.3, created_at: '2026-04-01T14:00:00Z' },
  { id: 'auto3', name: 'Webhook CRM cuando deal >$50k', trigger: { type: 'value_threshold', condition: 'deal_value >= 50000' }, actions: [{ type: 'webhook', label: 'POST a CRM externo' }, { type: 'notification', label: 'Notificar director comercial' }], status: 'active', deals_affected: 18, success_rate: 100, created_at: '2026-04-10T09:00:00Z' },
  { id: 'auto4', name: 'Email perder deal después de 30 días', trigger: { type: 'time_based', condition: 'stage = negotiation AND days > 30' }, actions: [{ type: 'email', label: 'Email reactivación' }, { type: 'field_update', label: 'Marcar en riesgo' }], status: 'paused', deals_affected: 11, success_rate: 44.2, created_at: '2026-04-20T16:00:00Z' },
  { id: 'auto5', name: 'Tarea de onboarding al cerrar deal', trigger: { type: 'stage_change', condition: 'stage = won' }, actions: [{ type: 'task', label: 'Crear checklist onboarding' }, { type: 'email', label: 'Bienvenida al cliente' }], status: 'active', deals_affected: 56, success_rate: 95.1, created_at: '2026-05-01T11:00:00Z' },
]

export const mockAutomationStats = { total: 5, active: 4, paused: 1, total_deals_affected: 386, avg_success_rate: 83.8 }

// ── Sales Reports ─────────────────────────────────────────────────────────────

export interface SalesReport {
  id: string; name: string; type: 'pipeline' | 'forecast' | 'performance' | 'activity'
  period: string; generated_at: string
  data: { total_deals: number; total_value: number; won_deals: number; won_value: number; lost_deals: number; avg_deal_size: number; avg_sales_cycle: number; conversion_rate: number }
}

export const mockSalesReports: SalesReport[] = [
  { id: 'rep1', name: 'Pipeline Report — Mayo 2026', type: 'pipeline', period: '2026-05', generated_at: '2026-05-10T08:00:00Z', data: { total_deals: 89, total_value: 1245678, won_deals: 23, won_value: 567890, lost_deals: 8, avg_deal_size: 13998, avg_sales_cycle: 45, conversion_rate: 25.8 } },
  { id: 'rep2', name: 'Forecast Q2 2026', type: 'forecast', period: '2026-Q2', generated_at: '2026-05-01T06:00:00Z', data: { total_deals: 134, total_value: 2890000, won_deals: 41, won_value: 1234567, lost_deals: 12, avg_deal_size: 21567, avg_sales_cycle: 52, conversion_rate: 30.6 } },
  { id: 'rep3', name: 'Performance Equipo — Abril 2026', type: 'performance', period: '2026-04', generated_at: '2026-05-01T09:00:00Z', data: { total_deals: 72, total_value: 890000, won_deals: 19, won_value: 423000, lost_deals: 9, avg_deal_size: 12361, avg_sales_cycle: 38, conversion_rate: 26.4 } },
  { id: 'rep4', name: 'Actividad CRM — Semana 19', type: 'activity', period: '2026-W19', generated_at: '2026-05-11T07:00:00Z', data: { total_deals: 12, total_value: 156000, won_deals: 3, won_value: 67000, lost_deals: 1, avg_deal_size: 13000, avg_sales_cycle: 29, conversion_rate: 25.0 } },
]

export const mockSalesReportStats = { reports: 4, total_pipeline_value: 1245678, avg_conversion: 26.95, avg_deal_size: 15232 }

// ── Customer Portal ───────────────────────────────────────────────────────────

export interface CustomerPortalUser {
  id: string; company: string; contact_name: string; email: string
  portal_access: boolean; last_login?: string; documents_shared: number
  open_tickets: number; total_orders: number; total_spent: number; plan: 'basic' | 'premium' | 'enterprise'
}

export const mockPortalUsers: CustomerPortalUser[] = [
  { id: 'p1', company: 'Constructora XYZ S.A.', contact_name: 'Ing. Roberto Sánchez', email: 'roberto@constructoraxyz.com', portal_access: true, last_login: '2026-05-09T14:30:00Z', documents_shared: 12, open_tickets: 2, total_orders: 34, total_spent: 567890, plan: 'enterprise' },
  { id: 'p2', company: 'Ferretera del Norte', contact_name: 'Ana García', email: 'ana@ferretera.mx', portal_access: true, last_login: '2026-05-11T10:00:00Z', documents_shared: 6, open_tickets: 0, total_orders: 18, total_spent: 234500, plan: 'premium' },
  { id: 'p3', company: 'Talleres Hernández', contact_name: 'Luis Hernández', email: 'luis@talleres.mx', portal_access: true, last_login: '2026-05-08T16:00:00Z', documents_shared: 4, open_tickets: 1, total_orders: 9, total_spent: 89400, plan: 'basic' },
  { id: 'p4', company: 'IMSS Delegación Norte', contact_name: 'Dr. Patricia Luna', email: 'pluna@imss.gob.mx', portal_access: false, last_login: undefined, documents_shared: 0, open_tickets: 0, total_orders: 0, total_spent: 0, plan: 'enterprise' },
  { id: 'p5', company: 'Hospital Santa Fe', contact_name: 'Lic. Marco Torres', email: 'mtorres@hospitalsf.mx', portal_access: true, last_login: '2026-05-07T09:15:00Z', documents_shared: 8, open_tickets: 3, total_orders: 22, total_spent: 445600, plan: 'premium' },
]

export const mockPortalStats = { total: 5, with_access: 4, no_access: 1, open_tickets: 6, total_docs: 30 }

// ── Loyalty Programs ──────────────────────────────────────────────────────────

export interface LoyaltyTier { name: string; min_spent: number; benefits: string[]; members: number; color: string }
export interface LoyaltyReward { name: string; points_cost: number; claimed: number }
export interface LoyaltyProgram {
  id: string; name: string; type: 'points' | 'tiers' | 'cashback'; status: 'active' | 'paused'
  members: number; points_issued: number; points_redeemed: number
  tiers?: LoyaltyTier[]; rewards: LoyaltyReward[]
}

export const mockLoyaltyPrograms: LoyaltyProgram[] = [
  {
    id: 'loy1', name: 'KapTools Pro Club', type: 'tiers', status: 'active', members: 1234, points_issued: 456789, points_redeemed: 123456,
    tiers: [
      { name: 'Bronze', min_spent: 0, benefits: ['5% descuento', 'Acceso early sales'], members: 890, color: '#cd7f32' },
      { name: 'Silver', min_spent: 10000, benefits: ['10% descuento', 'Envío gratis', 'Soporte prioritario'], members: 267, color: '#94a3b8' },
      { name: 'Gold', min_spent: 50000, benefits: ['15% descuento', 'Envío express', 'Account manager dedicado'], members: 77, color: '#CCFF00' },
    ],
    rewards: [
      { name: '10% descuento siguiente compra', points_cost: 500, claimed: 234 },
      { name: 'Envío gratis 1 mes', points_cost: 1000, claimed: 89 },
      { name: 'Kit herramientas gratis', points_cost: 5000, claimed: 12 },
    ],
  },
  {
    id: 'loy2', name: 'Cashback Industrial', type: 'cashback', status: 'active', members: 456, points_issued: 234567, points_redeemed: 89012,
    rewards: [
      { name: 'Cashback 3% en compras', points_cost: 0, claimed: 456 },
      { name: 'Cashback extra 5% fin de mes', points_cost: 1000, claimed: 67 },
    ],
  },
]

export const mockLoyaltyStats = { total_programs: 2, total_members: 1690, total_points_outstanding: 479108, redemption_rate: 32.4 }

// ── Purchase Orders ───────────────────────────────────────────────────────────

export interface POItem { sku: string; description: string; quantity: number; unit_price: number; total: number }
export interface PurchaseOrder {
  id: string; po_number: string; vendor_name: string; status: 'draft' | 'sent' | 'approved' | 'received' | 'cancelled'
  items_count: number; subtotal: number; tax: number; total: number
  expected_delivery: string; created_at: string; approved_at?: string
}

export const mockPurchaseOrders: PurchaseOrder[] = [
  { id: 'po1', po_number: 'PO-2026-0045', vendor_name: 'Proveedor Industrial Norte', status: 'sent', items_count: 2, subtotal: 111250, tax: 17800, total: 131550, expected_delivery: '2026-05-25', created_at: '2026-05-08T10:00:00Z' },
  { id: 'po2', po_number: 'PO-2026-0044', vendor_name: 'Distribuidora Centro S.A.', status: 'approved', items_count: 5, subtotal: 78500, tax: 12560, total: 92660, expected_delivery: '2026-05-20', created_at: '2026-05-05T09:00:00Z', approved_at: '2026-05-06T11:00:00Z' },
  { id: 'po3', po_number: 'PO-2026-0043', vendor_name: 'Importaciones Tech MX', status: 'received', items_count: 3, subtotal: 234000, tax: 37440, total: 274440, expected_delivery: '2026-05-10', created_at: '2026-04-28T08:00:00Z', approved_at: '2026-04-29T10:00:00Z' },
  { id: 'po4', po_number: 'PO-2026-0042', vendor_name: 'Logística Express Sur', status: 'draft', items_count: 1, subtotal: 45000, tax: 7200, total: 53400, expected_delivery: '2026-05-30', created_at: '2026-05-11T14:00:00Z' },
  { id: 'po5', po_number: 'PO-2026-0041', vendor_name: 'Proveedor Industrial Norte', status: 'cancelled', items_count: 4, subtotal: 189000, tax: 30240, total: 223440, expected_delivery: '2026-05-15', created_at: '2026-04-20T10:00:00Z' },
]

export const mockPOStats = { total: 5, draft: 1, sent: 1, approved: 1, received: 1, cancelled: 1, total_value_active: 317610 }

// ── Vendors Management ────────────────────────────────────────────────────────

export interface Vendor {
  id: string; name: string; contact_name: string; email: string; phone: string
  category: string; payment_terms: string; rating: number; total_purchases: number
  total_spent: number; active_pos: number; last_order_date: string; on_time_delivery_rate: number
  status: 'active' | 'inactive'
}

export const mockVendors: Vendor[] = [
  { id: 'v1', name: 'Proveedor Industrial Norte', contact_name: 'Carlos Méndez', email: 'ventas@provnorte.com', phone: '+52 222 555 1234', category: 'Herramientas Eléctricas', payment_terms: '30 días', rating: 4.5, total_purchases: 234, total_spent: 2456789, active_pos: 3, last_order_date: '2026-05-08', on_time_delivery_rate: 92.5, status: 'active' },
  { id: 'v2', name: 'Distribuidora Centro S.A.', contact_name: 'María López', email: 'compras@distcentro.mx', phone: '+52 55 8901 2345', category: 'Consumibles', payment_terms: '15 días', rating: 4.8, total_purchases: 567, total_spent: 1234567, active_pos: 1, last_order_date: '2026-05-05', on_time_delivery_rate: 98.1, status: 'active' },
  { id: 'v3', name: 'Importaciones Tech MX', contact_name: 'José Ramírez', email: 'jose@impotech.mx', phone: '+52 81 2345 6789', category: 'Electrónica Industrial', payment_terms: '45 días', rating: 3.9, total_purchases: 89, total_spent: 890000, active_pos: 0, last_order_date: '2026-04-28', on_time_delivery_rate: 78.4, status: 'active' },
  { id: 'v4', name: 'Logística Express Sur', contact_name: 'Ana Ruiz', email: 'ana@logexsur.mx', phone: '+52 998 456 7890', category: 'Logística y Embalaje', payment_terms: '30 días', rating: 4.2, total_purchases: 156, total_spent: 456789, active_pos: 1, last_order_date: '2026-05-11', on_time_delivery_rate: 89.7, status: 'active' },
  { id: 'v5', name: 'MFG Herramientas S.A.', contact_name: 'Pedro Castro', email: 'pcastro@mfgher.mx', phone: '+52 33 3456 7890', category: 'Herramientas Manuales', payment_terms: '60 días', rating: 2.8, total_purchases: 12, total_spent: 67000, active_pos: 0, last_order_date: '2026-02-15', on_time_delivery_rate: 55.0, status: 'inactive' },
]

export const mockVendorStats = { total: 5, active: 4, inactive: 1, avg_rating: 4.04, avg_on_time: 82.7, total_spent_ytd: 5105145 }

// ── Budget Planning ───────────────────────────────────────────────────────────

export interface BudgetCategory { name: string; budgeted: number; spent: number; remaining: number; pct: number; status: 'ok' | 'warning' | 'over' }
export interface Budget {
  id: string; period: string; department: string; categories: BudgetCategory[]
  total_budgeted: number; total_spent: number; total_remaining: number; status: 'on_track' | 'warning' | 'over_budget'
}

export const mockBudgets: Budget[] = [
  {
    id: 'b1', period: '2026-Q2', department: 'Operaciones',
    categories: [
      { name: 'Inventario / Compras', budgeted: 500000, spent: 345678, remaining: 154322, pct: 69.1, status: 'ok' },
      { name: 'Marketing Digital', budgeted: 100000, spent: 87654, remaining: 12346, pct: 87.7, status: 'warning' },
      { name: 'Tecnología / SaaS', budgeted: 50000, spent: 23456, remaining: 26544, pct: 46.9, status: 'ok' },
      { name: 'Logística', budgeted: 80000, spent: 79800, remaining: 200, pct: 99.8, status: 'over' },
      { name: 'Recursos Humanos', budgeted: 120000, spent: 60000, remaining: 60000, pct: 50.0, status: 'ok' },
    ],
    total_budgeted: 850000, total_spent: 596588, total_remaining: 253412, status: 'warning',
  },
  {
    id: 'b2', period: '2026-Q2', department: 'Comercial',
    categories: [
      { name: 'Comisiones', budgeted: 200000, spent: 112000, remaining: 88000, pct: 56.0, status: 'ok' },
      { name: 'Eventos y Ferias', budgeted: 60000, spent: 65000, remaining: -5000, pct: 108.3, status: 'over' },
      { name: 'Viáticos', budgeted: 40000, spent: 28900, remaining: 11100, pct: 72.3, status: 'ok' },
    ],
    total_budgeted: 300000, total_spent: 205900, total_remaining: 94100, status: 'warning',
  },
]

export const mockBudgetStats = { periods: 1, departments: 2, total_budgeted: 1150000, total_spent: 802488, burn_rate: 69.8 }

// ── Tax Reports ───────────────────────────────────────────────────────────────

export interface TaxReport {
  id: string; period: string; report_type: 'iva' | 'isr' | 'retenciones' | 'diot'
  sales_taxable: number; sales_tax_collected: number
  purchases_taxable: number; purchases_tax_paid: number; net_tax: number
  status: 'draft' | 'filed' | 'paid'; due_date: string; filed_date?: string
}

export const mockTaxReports: TaxReport[] = [
  { id: 'tx1', period: '2026-04', report_type: 'iva', sales_taxable: 342567, sales_tax_collected: 54810, purchases_taxable: 198453, purchases_tax_paid: 31752, net_tax: 23058, status: 'filed', due_date: '2026-05-17', filed_date: '2026-05-15' },
  { id: 'tx2', period: '2026-03', report_type: 'iva', sales_taxable: 289000, sales_tax_collected: 46240, purchases_taxable: 167800, purchases_tax_paid: 26848, net_tax: 19392, status: 'paid', due_date: '2026-04-17', filed_date: '2026-04-14' },
  { id: 'tx3', period: '2026-04', report_type: 'isr', sales_taxable: 342567, sales_tax_collected: 102770, purchases_taxable: 0, purchases_tax_paid: 0, net_tax: 102770, status: 'filed', due_date: '2026-05-17', filed_date: '2026-05-15' },
  { id: 'tx4', period: '2026-04', report_type: 'retenciones', sales_taxable: 45000, sales_tax_collected: 6750, purchases_taxable: 0, purchases_tax_paid: 0, net_tax: 6750, status: 'draft', due_date: '2026-05-17' },
  { id: 'tx5', period: '2026-Q1', report_type: 'diot', sales_taxable: 0, sales_tax_collected: 0, purchases_taxable: 520000, purchases_tax_paid: 83200, net_tax: 0, status: 'filed', due_date: '2026-04-30', filed_date: '2026-04-28' },
]

export const mockTaxStats = { total_reports: 5, filed: 3, paid: 1, draft: 1, total_iva_due: 23058, total_isr_due: 102770 }

// ── Instagram Shopping ────────────────────────────────────────────────────────

export interface IGShoppingProduct {
  id: string; product_name: string; price: number; tagged_posts: number
  product_views: number; clicks: number; purchases: number; revenue: number
  status: 'active' | 'paused'; ctr: number
}

export const mockIGShoppingProducts: IGShoppingProduct[] = [
  { id: 'ig1', product_name: 'Tensiómetro Digital OMRON HEM-7156', price: 1299, tagged_posts: 8, product_views: 4567, clicks: 345, purchases: 23, revenue: 29877, status: 'active', ctr: 7.6 },
  { id: 'ig2', product_name: 'Oxímetro Portátil CMS50D', price: 549, tagged_posts: 12, product_views: 9821, clicks: 892, purchases: 67, revenue: 36783, status: 'active', ctr: 9.1 },
  { id: 'ig3', product_name: 'Termómetro Infrarrojo Digital', price: 399, tagged_posts: 15, product_views: 14230, clicks: 1102, purchases: 89, revenue: 35511, status: 'active', ctr: 7.7 },
  { id: 'ig4', product_name: 'Glucómetro FreeStyle Lite', price: 799, tagged_posts: 4, product_views: 2341, clicks: 145, purchases: 11, revenue: 8789, status: 'paused', ctr: 6.2 },
  { id: 'ig5', product_name: 'Estetoscopio 3M Littmann', price: 2300, tagged_posts: 6, product_views: 3456, clicks: 234, purchases: 8, revenue: 18400, status: 'active', ctr: 6.8 },
]

export const mockIGShoppingStats = { total_products: 5, active: 4, paused: 1, total_views: 34415, total_revenue: 129360, avg_ctr: 7.5 }

// ── Meta Ads Manager ──────────────────────────────────────────────────────────

export interface MetaAdSet {
  id: string; campaign_name: string; ad_set_name: string
  platform: 'facebook' | 'instagram' | 'both'; objective: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales'
  budget_daily: number; status: 'active' | 'paused' | 'completed'
  impressions: number; reach: number; clicks: number; ctr: number; cpc: number
  conversions: number; cost_per_conversion: number; roas: number; spent: number; revenue: number
}

export const mockMetaAdSets: MetaAdSet[] = [
  { id: 'ma1', campaign_name: 'Salud — Mayo 2026', ad_set_name: 'Oxímetros — IG Stories', platform: 'instagram', objective: 'sales', budget_daily: 200, status: 'active', impressions: 67890, reach: 45678, clicks: 1234, ctr: 1.82, cpc: 3.24, conversions: 89, cost_per_conversion: 44.94, roas: 4.23, spent: 4000, revenue: 16920 },
  { id: 'ma2', campaign_name: 'Salud — Mayo 2026', ad_set_name: 'Tensiómetros — FB Feed', platform: 'facebook', objective: 'sales', budget_daily: 150, status: 'active', impressions: 43210, reach: 29000, clicks: 876, ctr: 2.03, cpc: 2.57, conversions: 56, cost_per_conversion: 40.09, roas: 3.89, spent: 2250, revenue: 8752 },
  { id: 'ma3', campaign_name: 'Marca KapTools', ad_set_name: 'Brand Awareness — Both', platform: 'both', objective: 'awareness', budget_daily: 100, status: 'active', impressions: 124500, reach: 89000, clicks: 456, ctr: 0.37, cpc: 2.19, conversions: 0, cost_per_conversion: 0, roas: 0, spent: 1000, revenue: 0 },
  { id: 'ma4', campaign_name: 'Lead Gen Médicos', ad_set_name: 'Profesionales — FB', platform: 'facebook', objective: 'leads', budget_daily: 250, status: 'active', impressions: 38900, reach: 24500, clicks: 734, ctr: 1.89, cpc: 5.12, conversions: 123, cost_per_conversion: 30.57, roas: 0, spent: 3760, revenue: 0 },
  { id: 'ma5', campaign_name: 'Retargeting Mayo', ad_set_name: 'Visitantes Web — IG', platform: 'instagram', objective: 'sales', budget_daily: 80, status: 'paused', impressions: 12340, reach: 8900, clicks: 345, ctr: 2.80, cpc: 1.85, conversions: 34, cost_per_conversion: 18.76, roas: 5.12, spent: 640, revenue: 3277 },
]

export const mockMetaAdStats = { total_spend: 11650, total_revenue: 28949, avg_roas: 4.12, total_impressions: 286840, total_conversions: 302, total_leads: 123 }

// ── Consolidated Metrics ──────────────────────────────────────────────────────

export interface ChannelRevenue { channel: string; amount: number; growth: number; color: string }
export interface ConsolidatedMetrics {
  period: string
  revenue: { total: number; growth: number; by_channel: ChannelRevenue[] }
  orders: { total: number; growth: number; avg_value: number; by_status: Record<string, number> }
  customers: { total: number; new: number; returning: number; churn_rate: number }
  inventory: { total_value: number; low_stock_items: number; out_of_stock: number; turnover_rate: number }
  marketing: { total_spend: number; roas: number; cac: number; ltv: number }
}

export const mockConsolidatedMetrics: ConsolidatedMetrics = {
  period: '2026-05',
  revenue: {
    total: 542789.50, growth: 18.5,
    by_channel: [
      { channel: 'Shopify', amount: 234567.50, growth: 25.3, color: '#CCFF00' },
      { channel: 'Mercado Libre', amount: 156789.00, growth: 12.1, color: '#facc15' },
      { channel: 'Amazon', amount: 123456.00, growth: 15.7, color: '#fb923c' },
      { channel: 'B2B Directo', amount: 27977.00, growth: 8.9, color: '#60a5fa' },
    ],
  },
  orders: { total: 487, growth: 14.2, avg_value: 1114.65, by_status: { pending: 23, processing: 45, shipped: 167, delivered: 234, cancelled: 18 } },
  customers: { total: 2345, new: 234, returning: 253, churn_rate: 12.3 },
  inventory: { total_value: 1456789.50, low_stock_items: 34, out_of_stock: 12, turnover_rate: 4.2 },
  marketing: { total_spend: 45678.90, roas: 11.88, cac: 195.16, ltv: 2318.92 },
}

export const mockRevenueHistory = [
  { month: 'Ene', shopify: 145000, ml: 98000, amazon: 78000, b2b: 18000 },
  { month: 'Feb', shopify: 167000, ml: 112000, amazon: 89000, b2b: 21000 },
  { month: 'Mar', shopify: 189000, ml: 134000, amazon: 98000, b2b: 23000 },
  { month: 'Abr', shopify: 210000, ml: 143000, amazon: 109000, b2b: 25000 },
  { month: 'May', shopify: 234567, ml: 156789, amazon: 123456, b2b: 27977 },
]

// ── Custom Reports ────────────────────────────────────────────────────────────

export interface CustomReport {
  id: string; name: string; type: 'sales' | 'inventory' | 'customers' | 'marketing' | 'financial'
  filters: Array<{ field: string; operator: string; value: string }>
  columns: string[]
  schedule?: { frequency: 'daily' | 'weekly' | 'monthly'; recipients: string[] }
  created_by: string; created_at: string; last_run?: string; records_last_run?: number
}

export const mockCustomReports: CustomReport[] = [
  { id: 'cr1', name: 'Ventas por Categoría — Semanal', type: 'sales', filters: [{ field: 'date', operator: 'last_7_days', value: '' }, { field: 'status', operator: 'equals', value: 'completed' }], columns: ['category', 'total_sales', 'units_sold', 'avg_price', 'growth'], schedule: { frequency: 'weekly', recipients: ['ventas@kaptools.com', 'admin@kaptools.com'] }, created_by: 'Carlos Cortés', created_at: '2026-03-15T10:00:00Z', last_run: '2026-05-10T08:00:00Z', records_last_run: 1234 },
  { id: 'cr2', name: 'Top 20 Productos — Mensual', type: 'inventory', filters: [{ field: 'date', operator: 'last_30_days', value: '' }], columns: ['sku', 'product_name', 'units_sold', 'revenue', 'margin'], schedule: { frequency: 'monthly', recipients: ['almacen@kaptools.com'] }, created_by: 'Laura Méndez', created_at: '2026-04-01T12:00:00Z', last_run: '2026-05-01T08:00:00Z', records_last_run: 20 },
  { id: 'cr3', name: 'CAC & LTV por Canal', type: 'marketing', filters: [{ field: 'date', operator: 'last_90_days', value: '' }], columns: ['channel', 'new_customers', 'cac', 'ltv', 'ltv_cac_ratio'], schedule: { frequency: 'monthly', recipients: ['marketing@kaptools.com'] }, created_by: 'Carlos Cortés', created_at: '2026-04-15T09:00:00Z', last_run: '2026-05-08T07:00:00Z', records_last_run: 4 },
  { id: 'cr4', name: 'Reporte Fiscal Mensual', type: 'financial', filters: [{ field: 'date', operator: 'current_month', value: '' }], columns: ['invoice_id', 'client', 'subtotal', 'iva', 'total', 'cfdi_uuid'], created_by: 'Miguel Torres', created_at: '2026-05-01T08:00:00Z', records_last_run: 89 },
  { id: 'cr5', name: 'Clientes en Riesgo', type: 'customers', filters: [{ field: 'last_purchase', operator: 'more_than_days', value: '60' }, { field: 'ltv', operator: 'greater_than', value: '5000' }], columns: ['customer_name', 'email', 'last_purchase', 'ltv', 'recommended_action'], schedule: { frequency: 'weekly', recipients: ['crm@kaptools.com'] }, created_by: 'Carlos Cortés', created_at: '2026-05-05T10:00:00Z', last_run: '2026-05-10T06:00:00Z', records_last_run: 47 },
]

export const mockCustomReportStats = { total: 5, scheduled: 3, manual: 2, avg_records: 279 }

// ── Export Center ─────────────────────────────────────────────────────────────

export interface ExportJob {
  id: string; name: string; type: 'orders' | 'products' | 'customers' | 'inventory' | 'financial'
  format: 'csv' | 'xlsx' | 'pdf' | 'json'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  records_count?: number; file_size_kb?: number; created_at: string; completed_at?: string; expires_at?: string
}

export const mockExportJobs: ExportJob[] = [
  { id: 'ex1', name: 'Órdenes Mayo 2026', type: 'orders', format: 'xlsx', status: 'completed', records_count: 487, file_size_kb: 234, created_at: '2026-05-10T09:00:00Z', completed_at: '2026-05-10T09:01:23Z', expires_at: '2026-05-17T09:00:00Z' },
  { id: 'ex2', name: 'Catálogo completo', type: 'products', format: 'csv', status: 'completed', records_count: 156, file_size_kb: 89, created_at: '2026-05-09T14:00:00Z', completed_at: '2026-05-09T14:00:45Z', expires_at: '2026-05-16T14:00:00Z' },
  { id: 'ex3', name: 'Clientes — Q2 2026', type: 'customers', format: 'xlsx', status: 'completed', records_count: 2345, file_size_kb: 512, created_at: '2026-05-08T11:00:00Z', completed_at: '2026-05-08T11:02:11Z', expires_at: '2026-05-15T11:00:00Z' },
  { id: 'ex4', name: 'Inventario actual', type: 'inventory', format: 'csv', status: 'processing', created_at: '2026-05-12T10:30:00Z' },
  { id: 'ex5', name: 'Facturas Abril', type: 'financial', format: 'pdf', status: 'completed', records_count: 89, file_size_kb: 1240, created_at: '2026-05-02T08:00:00Z', completed_at: '2026-05-02T08:05:33Z', expires_at: '2026-05-09T08:00:00Z' },
  { id: 'ex6', name: 'Reporte Ventas JSON', type: 'orders', format: 'json', status: 'failed', created_at: '2026-05-11T16:00:00Z' },
]

export const mockExportStats = { total: 6, completed: 4, processing: 1, failed: 1, total_size_mb: 2.1 }

// ── BI Dashboards ─────────────────────────────────────────────────────────────

export interface BIWidget { id: string; type: 'metric' | 'chart' | 'table' | 'map'; title: string; data_source: string; size: 'sm' | 'md' | 'lg' }
export interface BIDashboard {
  id: string; name: string; description: string; widgets: BIWidget[]
  shared_with: string[]; created_by: string; last_updated: string; views: number
}

export const mockBIDashboards: BIDashboard[] = [
  { id: 'bi1', name: 'Executive Overview', description: 'Vista 360° para dirección', widgets: [{ id: 'w1', type: 'metric', title: 'Revenue MTD', data_source: 'sales', size: 'sm' }, { id: 'w2', type: 'chart', title: 'Ventas por Canal', data_source: 'sales', size: 'lg' }, { id: 'w3', type: 'table', title: 'Top 10 Productos', data_source: 'products', size: 'md' }, { id: 'w4', type: 'metric', title: 'ROAS Global', data_source: 'marketing', size: 'sm' }], shared_with: ['admin@kaptools.com', 'ventas@kaptools.com'], created_by: 'Carlos Cortés', last_updated: '2026-05-09T14:30:00Z', views: 234 },
  { id: 'bi2', name: 'Marketing Performance', description: 'ROI y conversiones por canal', widgets: [{ id: 'w5', type: 'chart', title: 'ROAS por Canal', data_source: 'marketing', size: 'lg' }, { id: 'w6', type: 'metric', title: 'CAC Promedio', data_source: 'marketing', size: 'sm' }, { id: 'w7', type: 'chart', title: 'Embudo Conversión', data_source: 'funnel', size: 'md' }], shared_with: ['marketing@kaptools.com'], created_by: 'Laura Méndez', last_updated: '2026-05-10T09:00:00Z', views: 89 },
  { id: 'bi3', name: 'Inventory Intelligence', description: 'Stock, rotación y reorden', widgets: [{ id: 'w8', type: 'table', title: 'SKUs críticos', data_source: 'inventory', size: 'md' }, { id: 'w9', type: 'metric', title: 'Turnover Rate', data_source: 'inventory', size: 'sm' }], shared_with: ['almacen@kaptools.com'], created_by: 'Carlos Cortés', last_updated: '2026-05-08T16:00:00Z', views: 45 },
]

export const mockBIStats = { total_dashboards: 3, total_widgets: 9, total_views: 368, shared_users: 5 }

// ── Facebook Catalog ──────────────────────────────────────────────────────────

export interface FBCatalogProduct {
  id: string; retailer_id: string; sku: string; title: string; name: string; price: number
  availability: 'in stock' | 'out of stock' | 'preorder'
  status: 'approved' | 'pending' | 'rejected' | 'needs_update' | 'disapproved'
  category: string
  fb_catalog_id: string; facebook_product_id: string
  impressions: number; clicks: number; purchases: number
  issues: string[]
  last_synced: string
}

export const mockFBCatalog: FBCatalogProduct[] = [
  { id: 'fbc1', retailer_id: 'ORG-TEN-001', sku: 'ORG-TEN-001', title: 'Tensiómetro Digital OMRON HEM-7156', name: 'Tensiómetro Digital OMRON HEM-7156', price: 1299, availability: 'in stock', status: 'approved', category: 'Diagnóstico', fb_catalog_id: 'FB-4567891', facebook_product_id: 'FB-4567891', impressions: 12340, clicks: 456, purchases: 34, issues: [], last_synced: '2026-05-12T08:00:00Z' },
  { id: 'fbc2', retailer_id: 'ORG-OXI-002', sku: 'ORG-OXI-002', title: 'Oxímetro Portátil CMS50D', name: 'Oxímetro Portátil CMS50D', price: 549, availability: 'in stock', status: 'approved', category: 'Diagnóstico', fb_catalog_id: 'FB-4567892', facebook_product_id: 'FB-4567892', impressions: 23456, clicks: 890, purchases: 67, issues: [], last_synced: '2026-05-12T08:00:00Z' },
  { id: 'fbc3', retailer_id: 'ORG-GLU-003', sku: 'ORG-GLU-003', title: 'Glucómetro FreeStyle Lite Abbott', name: 'Glucómetro FreeStyle Lite Abbott', price: 799, availability: 'in stock', status: 'needs_update', category: 'Glucometría', fb_catalog_id: 'FB-4567893', facebook_product_id: 'FB-4567893', impressions: 7890, clicks: 234, purchases: 12, issues: ['Imagen sin fondo blanco', 'Descripción muy corta'], last_synced: '2026-05-10T08:00:00Z' },
  { id: 'fbc4', retailer_id: 'ORG-NEB-004', sku: 'ORG-NEB-004', title: 'Nebulizador Compacto NEB-200', name: 'Nebulizador Compacto NEB-200', price: 1850, availability: 'out of stock', status: 'pending', category: 'Respiratorio', fb_catalog_id: '', facebook_product_id: '', impressions: 0, clicks: 0, purchases: 0, issues: [], last_synced: '2026-05-11T08:00:00Z' },
  { id: 'fbc5', retailer_id: 'ORG-TER-005', sku: 'ORG-TER-005', title: 'Termómetro Infrarrojo Digital', name: 'Termómetro Infrarrojo Digital', price: 399, availability: 'out of stock', status: 'rejected', category: 'Diagnóstico', fb_catalog_id: 'FB-4567895', facebook_product_id: 'FB-4567895', impressions: 0, clicks: 0, purchases: 0, issues: ['Producto no permitido sin certificación'], last_synced: '2026-05-09T08:00:00Z' },
  { id: 'fbc6', retailer_id: 'ORG-EST-006', sku: 'ORG-EST-006', title: 'Estetoscopio 3M Littmann', name: 'Estetoscopio 3M Littmann', price: 2300, availability: 'in stock', status: 'approved', category: 'Auscultación', fb_catalog_id: 'FB-4567896', facebook_product_id: 'FB-4567896', impressions: 4560, clicks: 123, purchases: 8, issues: [], last_synced: '2026-05-12T08:00:00Z' },
]

export const mockFBCatalogStats = { total: 6, approved: 3, pending: 1, rejected: 1, needs_update: 1, active: 4, synced_today: 3, total_purchases: 121, total_revenue: 112345 }

// ── WhatsApp Templates ────────────────────────────────────────────────────────

export interface WATemplate {
  id: string; name: string; category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string; status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT'
  header?: string; body: string; footer?: string
  buttons?: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string }>
  send_count: number; usage_count: number; open_rate: number; created_at: string
  variables: number
}

export const mockWATemplates: WATemplate[] = [
  { id: 'wat1', name: 'bienvenida_cliente', category: 'MARKETING', language: 'es_MX', status: 'APPROVED', header: 'Bienvenido a KapTools Medical 🎉', body: 'Hola {{1}}, gracias por registrarte. Tu cuenta está lista. ¿En qué podemos ayudarte hoy?', footer: 'KapTools Medical — Para tu salud', buttons: [{ type: 'QUICK_REPLY', text: 'Ver catálogo' }, { type: 'QUICK_REPLY', text: 'Hablar con asesor' }], send_count: 1234, usage_count: 1234, open_rate: 78.4, variables: 1, created_at: '2026-03-01T10:00:00Z' },
  { id: 'wat2', name: 'confirmacion_pedido', category: 'UTILITY', language: 'es_MX', status: 'APPROVED', header: 'Tu pedido está confirmado ✅', body: 'Hola {{1}}, tu pedido #{{2}} por ${{3}} MXN ha sido confirmado. Tiempo estimado: {{4}} días hábiles.', footer: 'Puedes rastrear tu pedido en nuestra app', buttons: [{ type: 'URL', text: 'Rastrear pedido', url: 'https://kaptools.com/tracking/{{1}}' }], send_count: 2456, usage_count: 2456, open_rate: 91.2, variables: 4, created_at: '2026-03-10T09:00:00Z' },
  { id: 'wat3', name: 'recordatorio_pago', category: 'UTILITY', language: 'es_MX', status: 'APPROVED', body: 'Hola {{1}}, te recordamos que tienes una factura por ${{2}} con vencimiento el {{3}}. Por favor realiza tu pago para continuar sin interrupciones.', buttons: [{ type: 'URL', text: 'Pagar ahora', url: 'https://kaptools.com/payment/{{1}}' }, { type: 'QUICK_REPLY', text: 'Ya pagué' }], send_count: 456, usage_count: 456, open_rate: 65.3, variables: 3, created_at: '2026-04-01T08:00:00Z' },
  { id: 'wat4', name: 'promo_semana_salud', category: 'MARKETING', language: 'es_MX', status: 'PENDING', header: '🩺 Semana de la Salud — 20% OFF', body: 'Hola {{1}}, esta semana todos los equipos de diagnóstico tienen 20% de descuento. ¡Solo hasta el domingo!', footer: 'Oferta exclusiva para clientes registrados', buttons: [{ type: 'URL', text: 'Ver ofertas', url: 'https://kaptools.com/promo' }, { type: 'QUICK_REPLY', text: 'No me interesa' }], send_count: 0, usage_count: 0, open_rate: 0, variables: 1, created_at: '2026-05-11T14:00:00Z' },
  { id: 'wat5', name: 'encuesta_satisfaccion', category: 'UTILITY', language: 'es_MX', status: 'APPROVED', body: 'Hola {{1}}, ¿cómo calificarías tu compra reciente de {{2}}? Tu opinión nos ayuda a mejorar.', buttons: [{ type: 'QUICK_REPLY', text: '⭐⭐⭐⭐⭐ Excelente' }, { type: 'QUICK_REPLY', text: '⭐⭐⭐ Regular' }, { type: 'QUICK_REPLY', text: '⭐ Necesita mejorar' }], send_count: 890, usage_count: 890, open_rate: 83.7, variables: 2, created_at: '2026-04-15T11:00:00Z' },
]

export const mockWATemplateStats = { total: 5, approved: 4, pending: 1, rejected: 0, avg_open_rate: 79.7, total_sent: 5036 }

// ── Cost Analysis ─────────────────────────────────────────────────────────────

export interface CostCategory { name: string; amount: number; percentage: number; color: string }
export interface CostProduct { sku: string; name: string; revenue: number; cogs: number; gross_margin: number; gross_margin_pct: number }
export interface CostAnalysis {
  period: string
  total_revenue: number; total_cogs: number; gross_profit: number; gross_margin_pct: number
  categories: CostCategory[]
  top_products: CostProduct[]
}

const _costCategories: CostCategory[] = [
  { name: 'COGS (Mercancía)', amount: 198453, percentage: 66.4, color: '#f87171' },
  { name: 'Nómina / Labor',   amount: 45679,  percentage: 15.3, color: '#fb923c' },
  { name: 'Logística',        amount: 28935,  percentage: 9.7,  color: '#facc15' },
  { name: 'Marketing',        amount: 15235,  percentage: 5.1,  color: '#60a5fa' },
  { name: 'Tecnología / SaaS',amount: 10464,  percentage: 3.5,  color: '#a78bfa' },
]
const _costProducts: CostProduct[] = [
  { sku: 'ORG-OXI-002', name: 'Oxímetro Portátil CMS50D',           revenue: 171288, cogs: 65520,  gross_margin: 105768, gross_margin_pct: 61.7 },
  { sku: 'ORG-TEN-001', name: 'Tensiómetro Digital OMRON HEM-7156', revenue: 192252, cogs: 100640, gross_margin: 91612,  gross_margin_pct: 47.6 },
  { sku: 'ORG-TER-005', name: 'Termómetro Infrarrojo Digital',      revenue: 35511,  cogs: 12905,  gross_margin: 22606,  gross_margin_pct: 63.7 },
  { sku: 'ORG-EST-006', name: 'Estetoscopio 3M Littmann',           revenue: 96600,  cogs: 46200,  gross_margin: 50400,  gross_margin_pct: 52.2 },
  { sku: 'ORG-GLU-003', name: 'Glucómetro FreeStyle Lite',          revenue: 22372,  cogs: 10640,  gross_margin: 11732,  gross_margin_pct: 52.4 },
]

export const mockCostAnalysis: CostAnalysis[] = [
  { period: 'Enero',  total_revenue: 498234, total_cogs: 278012, gross_profit: 220222, gross_margin_pct: 44.2, categories: _costCategories, top_products: _costProducts },
  { period: 'Febrero',total_revenue: 521456, total_cogs: 289234, gross_profit: 232222, gross_margin_pct: 44.5, categories: _costCategories, top_products: _costProducts },
  { period: 'Marzo',  total_revenue: 542789, total_cogs: 298765, gross_profit: 244024, gross_margin_pct: 45.0, categories: _costCategories, top_products: _costProducts },
]

export const mockCostStats = {
  total_costs: 298765.50, revenue: 542789.50, gross_margin: 45.0, fixed_pct: 29.9, variable_pct: 70.1,
  avg_gross_margin: 44.6, best_category: 'Termómetros', worst_category: 'Tensiómetros', products_analyzed: 47,
}

// ── Cash Flow Forecast ────────────────────────────────────────────────────────

export interface CashFlowMonth {
  month: string; label: string
  inflows: number; outflows: number
  net: number; balance: number
  forecast?: boolean
}

export const mockCashFlowMonths: CashFlowMonth[] = [
  { month: 'Mar', label: 'Marzo',  inflows: 456789, outflows: 312456, net: 144333,  balance: 456789, forecast: false },
  { month: 'Abr', label: 'Abril',  inflows: 478368, outflows: 336908, net: 141460,  balance: 598249, forecast: false },
  { month: 'May', label: 'Mayo',   inflows: 540257, outflows: 358775, net: 181482,  balance: 779731, forecast: false },
  { month: 'Jun', label: 'Junio',  inflows: 597000, outflows: 383000, net: 214000,  balance: 993731, forecast: true  },
  { month: 'Jul', label: 'Julio',  inflows: 620000, outflows: 395000, net: 225000,  balance: 1218731, forecast: true },
  { month: 'Ago', label: 'Agosto', inflows: 645000, outflows: 408000, net: 237000,  balance: 1455731, forecast: true },
]

export const mockCashFlowStats = {
  current_balance: 779731, forecast_3m_end: 1455731,
  scenarios: { optimistic: 1600000, realistic: 1455731, pessimistic: 1200000 },
  avg_monthly_net: 190546,
  min_balance: 456789,
  months_positive: 6,
}
