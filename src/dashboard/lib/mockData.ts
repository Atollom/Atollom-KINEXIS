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
