"use client";

import { useState } from "react";

interface NewCFDIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMAS_PAGO = [
  { value: "01", label: "Efectivo" },
  { value: "02", label: "Cheque" },
  { value: "03", label: "Transferencia" },
  { value: "04", label: "Tarjeta crédito" },
  { value: "28", label: "Tarjeta débito" },
  { value: "99", label: "Por definir" },
];

export function NewCFDIModal({ isOpen, onClose }: NewCFDIModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/cfdi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id:            form.get("order_id"),
          customer_rfc:        form.get("customer_rfc") || undefined,
          customer_name:       form.get("customer_name") || undefined,
          customer_email:      form.get("customer_email") || undefined,
          customer_zip:        form.get("customer_zip") || undefined,
          uso_cfdi:            form.get("uso_cfdi"),
          forma_pago:          form.get("forma_pago"),
          metodo_pago:         form.get("metodo_pago"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva factura CFDI"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg glass-panel-light rounded-t-2xl sm:rounded-2xl p-6 space-y-5 border border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container" aria-hidden="true">receipt_long</span>
            Nueva Factura CFDI
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <p className="chip-error" role="alert">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order ID */}
          <div>
            <label className="label-sm text-on-surface-variant block mb-1" htmlFor="order_id">
              ID de Orden *
            </label>
            <input
              id="order_id"
              name="order_id"
              required
              placeholder="ord-xxxxx"
              className="input-mission w-full text-sm"
            />
          </div>

          {/* RFC + Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm text-on-surface-variant block mb-1" htmlFor="customer_rfc">
                RFC
              </label>
              <input
                id="customer_rfc"
                name="customer_rfc"
                placeholder="XAXX010101000"
                className="input-mission w-full text-sm"
              />
            </div>
            <div>
              <label className="label-sm text-on-surface-variant block mb-1" htmlFor="customer_zip">
                CP Receptor
              </label>
              <input
                id="customer_zip"
                name="customer_zip"
                placeholder="06600"
                maxLength={5}
                className="input-mission w-full text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label-sm text-on-surface-variant block mb-1" htmlFor="customer_email">
              Email receptor
            </label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              placeholder="cliente@email.com"
              className="input-mission w-full text-sm"
            />
          </div>

          {/* Forma pago + Metodo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm text-on-surface-variant block mb-1" htmlFor="forma_pago">
                Forma de pago
              </label>
              <select
                id="forma_pago"
                name="forma_pago"
                defaultValue="03"
                className="
                  bg-surface-container-lowest text-on-surface text-xs
                  border-b border-outline-variant focus:border-primary-container
                  w-full py-2 outline-none transition-colors rounded-t-sm
                "
              >
                {FORMAS_PAGO.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-sm text-on-surface-variant block mb-1" htmlFor="metodo_pago">
                Método de pago
              </label>
              <select
                id="metodo_pago"
                name="metodo_pago"
                defaultValue="PUE"
                className="
                  bg-surface-container-lowest text-on-surface text-xs
                  border-b border-outline-variant focus:border-primary-container
                  w-full py-2 outline-none transition-colors rounded-t-sm
                "
              >
                <option value="PUE">PUE — Una sola exhibición</option>
                <option value="PPD">PPD — Parcialidades o diferido</option>
              </select>
            </div>
          </div>

          {/* Uso CFDI */}
          <div>
            <label className="label-sm text-on-surface-variant block mb-1" htmlFor="uso_cfdi">
              Uso CFDI
            </label>
            <select
              id="uso_cfdi"
              name="uso_cfdi"
              defaultValue="G03"
              className="
                bg-surface-container-lowest text-on-surface text-xs
                border-b border-outline-variant focus:border-primary-container
                w-full py-2 outline-none transition-colors rounded-t-sm
              "
            >
              <option value="G03">G03 — Gastos en general</option>
              <option value="G01">G01 — Adquisición de mercancias</option>
              <option value="P01">P01 — Por definir</option>
              <option value="S01">S01 — Sin efectos fiscales</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-glass flex-1 py-3">
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-volt flex-1 py-3 flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="material-symbols-outlined text-sm animate-spin" aria-hidden="true">sync</span>
              )}
              {submitting ? "TIMBRANDO…" : "TIMBRAR CFDI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
