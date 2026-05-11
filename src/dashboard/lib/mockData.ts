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
