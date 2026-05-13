'use client'

import { useState } from 'react'
import { TimbrarButton } from '@/components/TimbrarButton'

const TEST_DATA = {
  customerData: { rfc: 'XAXX010101000', name: 'Cliente de Prueba SA de CV', email: 'test@example.com' },
  items: [{ quantity: 1, description: 'Producto de prueba KINEXIS', unit_price: 100.00, product_key: '01010101' }],
}

interface InvoiceResult {
  uuid?: string
  folio_number?: string | number
  total?: number
  created_at?: string
  verification_url?: string
  status?: string
  provider?: string
}

export default function CFDITestPage() {
  const [result, setResult] = useState<InvoiceResult | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black tight-tracking" style={{ color: 'var(--text-primary)' }}>CFDI Test</h1>
          <span className="px-2 py-1 rounded-full bg-[#facc15]/10 border border-[#facc15]/20 text-[9px] font-black label-tracking text-[#facc15]">SANDBOX</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Prueba el timbrado en modo TEST — facturas no válidas fiscalmente</p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}>
        <span className="material-symbols-outlined !text-[18px] text-[#facc15] flex-shrink-0 mt-0.5">warning</span>
        <p className="text-xs text-[#facc15]">
          <span className="font-bold">Modo TEST:</span> Las facturas generadas con claves <code className="font-mono bg-black/20 px-1 rounded">sk_test_...</code> no tienen validez fiscal.
          Para producción, cambia a <code className="font-mono bg-black/20 px-1 rounded">FACTURAPI_ENVIRONMENT=live</code>.
        </p>
      </div>

      {/* Test card */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Datos de prueba</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'RFC', value: TEST_DATA.customerData.rfc },
            { label: 'Razón Social', value: TEST_DATA.customerData.name },
            { label: 'Email', value: TEST_DATA.customerData.email },
            { label: 'Total', value: `$${TEST_DATA.items[0].unit_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` },
          ].map(row => (
            <div key={row.label}>
              <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{row.label.toUpperCase()}</p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{row.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-[10px] label-tracking mb-3" style={{ color: 'var(--text-muted)' }}>CONCEPTOS</p>
          {TEST_DATA.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.description}</span>
              <span className="font-mono font-bold" style={{ color: '#CCFF00' }}>${item.unit_price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <TimbrarButton
          {...TEST_DATA}
          onSuccess={inv => setResult(inv as InvoiceResult)}
        />
      </div>

      {/* Result card */}
      {result && (
        <div className="glass-card rounded-2xl p-5 space-y-4" style={{ border: '1px solid rgba(74,222,128,0.3)' }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px] text-[#4ade80]">check_circle</span>
            <h2 className="text-sm font-bold text-[#4ade80]">Factura timbrada exitosamente</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'UUID', value: result.uuid ? `${result.uuid.slice(0, 8)}…` : '—' },
              { label: 'Folio', value: String(result.folio_number ?? '—') },
              { label: 'Total', value: result.total ? `$${result.total.toLocaleString()}` : '—' },
              { label: 'Proveedor', value: result.provider ?? '—' },
            ].map(r => (
              <div key={r.label}>
                <p className="text-[10px] label-tracking mb-1" style={{ color: 'var(--text-muted)' }}>{r.label.toUpperCase()}</p>
                <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{r.value}</p>
              </div>
            ))}
          </div>

          {result.uuid && (
            <p className="text-[10px] font-mono p-2 rounded-lg" style={{ backgroundColor: 'rgba(74,222,128,0.05)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>
              UUID: {result.uuid}
            </p>
          )}

          {result.verification_url && (
            <a
              href={result.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60a5fa] hover:underline"
            >
              <span className="material-symbols-outlined !text-[13px]">open_in_new</span>
              Verificar en SAT
            </a>
          )}

          {result.created_at && (
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Timbrado: {new Date(result.created_at).toLocaleString('es-MX')}
            </p>
          )}
        </div>
      )}

      {/* Env guide */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Pasar a producción</h3>
        {[
          { step: '1', text: 'Obtén tu llave live en facturapi.io → Organización → API Keys' },
          { step: '2', text: 'Railway → Variables → FACTURAPI_SECRET_KEY=sk_live_...' },
          { step: '3', text: 'Railway → Variables → FACTURAPI_ENVIRONMENT=live' },
          { step: '4', text: 'Redeploy → ✅ Timbrado fiscal activo' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
              style={{ backgroundColor: 'rgba(204,255,0,0.15)', color: '#CCFF00' }}>{s.step}</span>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
