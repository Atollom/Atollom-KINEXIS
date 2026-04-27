import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/PageHeader'
import { InvoiceHistoryTable, type Invoice } from './components/InvoiceHistoryTable'
import { UsageWrapper } from './components/UsageWrapper'

export const metadata: Metadata = {
  title: 'Uso de Timbres CFDI | KINEXIS',
  description: 'Monitorea tu cuota mensual de timbres CFDI',
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-1234567890AB',
    folio_number: 'F-2026-042',
    receiver_name: 'Ferretería Central SA de CV',
    receiver_rfc: 'FER850101ABC',
    total: 12_180.00,
    status: 'valid',
    created_at: '2026-04-21T14:30:00Z',
    xml_url: '#',
    pdf_url: '#',
  },
  {
    id: '2',
    uuid: 'B2C3D4E5-F6A7-8901-BCDE-234567890ABC',
    folio_number: 'F-2026-041',
    receiver_name: 'Construcciones del Norte',
    receiver_rfc: 'CON840215XYZ',
    total: 8_500.00,
    status: 'valid',
    created_at: '2026-04-20T10:15:00Z',
    xml_url: '#',
    pdf_url: '#',
  },
  {
    id: '3',
    uuid: 'C3D4E5F6-A7B8-9012-CDEF-34567890ABCD',
    folio_number: 'F-2026-040',
    receiver_name: 'Distribuidora Omega SC',
    receiver_rfc: 'DOM920301AB9',
    total: 3_250.00,
    status: 'cancelled',
    created_at: '2026-04-19T09:00:00Z',
  },
]

async function getInvoices(): Promise<Invoice[]> {
  // TODO: fetch from /api/cfdi/invoices when auth + backend connected
  return MOCK_INVOICES
}

export default async function CFDIUsagePage() {
  const invoices = await getInvoices()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uso de Timbres CFDI"
        description="Cuota mensual · Agente #13"
        badge="#13"
      />

      {/* Client component — fetches /api/cfdi/usage in browser (allows Playwright mocking) */}
      <UsageWrapper />

      <InvoiceHistoryTable invoices={invoices} />
    </div>
  )
}
