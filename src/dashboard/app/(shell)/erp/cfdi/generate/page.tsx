'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Receipt, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FormState {
  receiver_rfc: string
  receiver_name: string
  payment_form: string
  payment_method: string
  cfdi_use: string
  description: string
  unit_price: string
  quantity: string
}

const PAYMENT_FORMS = [
  { value: '01', label: '01 - Efectivo' },
  { value: '03', label: '03 - Transferencia electrónica' },
  { value: '04', label: '04 - Tarjeta de crédito' },
  { value: '28', label: '28 - Tarjeta de débito' },
  { value: '99', label: '99 - Por definir' },
]

const CFDI_USES = [
  { value: 'G01', label: 'G01 - Adquisición de mercancias' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'P01', label: 'P01 - Por definir' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
]

const FIELD_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-colors'
const LABEL_CLASS = 'block text-xs font-medium text-white/50 mb-1.5'

export default function GenerateCFDIPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    receiver_rfc: '',
    receiver_name: '',
    payment_form: '03',
    payment_method: 'PUE',
    cfdi_use: 'G03',
    description: '',
    unit_price: '',
    quantity: '1',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const total = parseFloat(form.unit_price || '0') * parseInt(form.quantity || '1', 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/cfdi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_rfc: form.receiver_rfc.toUpperCase().trim(),
          customer_name: form.receiver_name.trim(),
          payment_form: form.payment_form,
          payment_method: form.payment_method,
          use: form.cfdi_use,
          items: [{
            description: form.description,
            unit_price: parseFloat(form.unit_price),
            quantity: parseInt(form.quantity, 10),
          }],
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Error al generar la factura')
      }

      router.push('/erp/cfdi/usage')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Generar Factura CFDI"
        description="Emite un comprobante fiscal timbrado por el SAT"
        badge="#13"
        actions={
          <Link
            href="/erp/cfdi/usage"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 space-y-5">
        {/* Receptor */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#CCFF00]" />
            Datos del receptor
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>RFC receptor *</label>
              <input
                required
                className={FIELD_CLASS}
                placeholder="RFC850101ABC"
                value={form.receiver_rfc}
                onChange={set('receiver_rfc')}
                maxLength={13}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Razón social *</label>
              <input
                required
                className={FIELD_CLASS}
                placeholder="Empresa SA de CV"
                value={form.receiver_name}
                onChange={set('receiver_name')}
              />
            </div>
          </div>
        </div>

        {/* Concepto */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Concepto</h4>
          <div className="space-y-3">
            <div>
              <label className={LABEL_CLASS}>Descripción *</label>
              <textarea
                required
                className={`${FIELD_CLASS} resize-none`}
                placeholder="Venta de mercancía..."
                rows={2}
                value={form.description}
                onChange={set('description')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Precio unitario (MXN) *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={FIELD_CLASS}
                  placeholder="0.00"
                  value={form.unit_price}
                  onChange={set('unit_price')}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className={FIELD_CLASS}
                  value={form.quantity}
                  onChange={set('quantity')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pago */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Configuración fiscal</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASS}>Forma de pago</label>
              <select className={FIELD_CLASS} value={form.payment_form} onChange={set('payment_form')}>
                {PAYMENT_FORMS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Método de pago</label>
              <select className={FIELD_CLASS} value={form.payment_method} onChange={set('payment_method')}>
                <option value="PUE">PUE - Pago en una sola exhibición</option>
                <option value="PPD">PPD - Pago en parcialidades</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Uso CFDI</label>
              <select className={FIELD_CLASS} value={form.cfdi_use} onChange={set('cfdi_use')}>
                {CFDI_USES.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div className="flex items-center justify-between p-4 bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-xl">
            <span className="text-sm text-white/60">Total estimado (sin IVA)</span>
            <span className="text-lg font-bold text-[#CCFF00] tabular-nums">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#CCFF00] hover:bg-[#CCFF00]/90 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Timbrando con el SAT...
            </>
          ) : (
            <>
              <Receipt className="w-4 h-4" />
              Generar Factura CFDI
            </>
          )}
        </button>
      </form>
    </div>
  )
}
