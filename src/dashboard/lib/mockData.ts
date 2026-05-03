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
