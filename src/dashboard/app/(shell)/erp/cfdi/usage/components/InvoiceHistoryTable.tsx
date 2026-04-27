'use client'

import { FileText, Download, XCircle } from 'lucide-react'
import { useState } from 'react'

export interface Invoice {
  id: string
  uuid: string
  folio_number: string
  receiver_name: string
  receiver_rfc: string
  total: number
  status: 'valid' | 'cancelled'
  created_at: string
  xml_url?: string
  pdf_url?: string
}

interface InvoiceHistoryTableProps {
  invoices: Invoice[]
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const DATE_FMT = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

export function InvoiceHistoryTable({ invoices }: InvoiceHistoryTableProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (url: string, filename: string) => {
    setDownloading(filename)
    try {
      window.open(url, '_blank')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h3 className="text-base font-semibold text-white">Facturas Recientes</h3>
        <p className="text-xs text-white/40 mt-0.5">
          {invoices.length === 0 ? 'Sin facturas' : `Últimas ${invoices.length} facturas emitidas`}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">No hay facturas emitidas</p>
          <p className="text-xs text-white/25 mt-1">Las facturas aparecerán aquí cuando las generes</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Folio', 'Cliente', 'RFC', 'Total', 'Status', 'Fecha', 'Archivos'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-sm font-medium text-white">{inv.folio_number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 max-w-[160px]">
                    <span className="text-sm text-white/70 truncate block">{inv.receiver_name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-white/50">{inv.receiver_rfc}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-white tabular-nums">
                      {MXN.format(inv.total)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {inv.status === 'valid' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#CCFF00]/10 text-[#CCFF00]">
                        Válida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400">
                        <XCircle className="w-3 h-3" />
                        Cancelada
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-white/40">
                      {DATE_FMT.format(new Date(inv.created_at))}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {inv.xml_url && (
                        <button
                          onClick={() => handleDownload(inv.xml_url!, `${inv.folio_number}.xml`)}
                          disabled={downloading === `${inv.folio_number}.xml`}
                          title="Descargar XML"
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      )}
                      {inv.pdf_url && (
                        <button
                          onClick={() => handleDownload(inv.pdf_url!, `${inv.folio_number}.pdf`)}
                          disabled={downloading === `${inv.folio_number}.pdf`}
                          title="Descargar PDF"
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <FileText className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
