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
