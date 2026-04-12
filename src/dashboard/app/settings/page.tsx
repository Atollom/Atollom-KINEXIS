"use client";

import { useEffect, useState } from "react";

interface BusinessRules {
  ml_margin:           number;
  amazon_margin:       number;
  shopify_margin:      number;
  b2b_margin:          number;
  stock_safety_days:   number;
  stock_critical_days: number;
  nps_cooldown_days:   number;
}

const MARGIN_MINIMUMS: Record<keyof Pick<BusinessRules, "ml_margin" | "amazon_margin" | "shopify_margin" | "b2b_margin">, number> = {
  ml_margin:      1.20,
  amazon_margin:  1.25,
  shopify_margin: 1.30,
  b2b_margin:     1.18,
};

export default function SettingsPage() {
  const [rules, setRules]       = useState<BusinessRules | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    fetch("/api/settings/business-rules")
      .then(r => r.json())
      .then((data: BusinessRules) => setRules(data))
      .catch(() => setError("No se pudo cargar la configuración."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rules) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/business-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      const data = await res.json() as { error?: string; details?: unknown };
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof BusinessRules, value: number) {
    setRules(prev => prev ? { ...prev, [field]: value } : prev);
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl space-y-6">
      <header>
        <p className="label-sm text-on-surface-variant mb-1 uppercase tracking-widest">Sistema</p>
        <h1 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">
          CONFIGURACIÓN
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">Reglas de negocio del tenant</p>
      </header>

      {error && <p className="chip-error" role="alert">{error}</p>}
      {success && (
        <p className="bg-success/10 text-success border border-success/20 rounded-lg px-4 py-2 text-sm" role="status">
          Configuración guardada correctamente.
        </p>
      )}

      {rules && (
        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Márgenes de ganancia ─────────────────────────── */}
          <section className="bg-surface-container-high rounded-xl p-6 space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-lg" aria-hidden="true">sell</span>
              Márgenes de Ganancia
            </h2>
            <p className="text-[10px] text-on-surface-variant">
              Mínimo: ML ≥1.20 · Amazon ≥1.25 · Shopify ≥1.30 · B2B ≥1.18
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(MARGIN_MINIMUMS) as [keyof typeof MARGIN_MINIMUMS, number][]).map(([field, min]) => {
                const label = field.replace("_margin", "").replace("ml", "ML").replace("amazon", "Amazon").replace("shopify", "Shopify").replace("b2b", "B2B");
                const val = rules[field];
                const isBelow = val < min;
                return (
                  <div key={field}>
                    <label className="label-sm text-on-surface-variant block mb-1" htmlFor={field}>
                      {label}
                      {isBelow && <span className="ml-2 text-error text-[9px]">↓ mínimo {min}</span>}
                    </label>
                    <input
                      id={field}
                      type="number"
                      step="0.01"
                      min={min}
                      value={val}
                      onChange={e => updateField(field, parseFloat(e.target.value) || 0)}
                      className={`input-mission w-full text-sm ${isBelow ? "border-error/50" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Umbrales de stock ────────────────────────────── */}
          <section className="bg-surface-container-high rounded-xl p-6 space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-lg" aria-hidden="true">inventory_2</span>
              Umbrales de Inventario
            </h2>
            {rules.stock_critical_days >= rules.stock_safety_days && (
              <p className="text-error text-xs">
                stock_critical_days debe ser menor que stock_safety_days
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-sm text-on-surface-variant block mb-1" htmlFor="stock_safety_days">
                  Días preventivo (Warning)
                </label>
                <input
                  id="stock_safety_days"
                  type="number"
                  min={rules.stock_critical_days + 1}
                  value={rules.stock_safety_days}
                  onChange={e => updateField("stock_safety_days", parseInt(e.target.value) || 0)}
                  className="input-mission w-full text-sm"
                />
              </div>
              <div>
                <label className="label-sm text-on-surface-variant block mb-1" htmlFor="stock_critical_days">
                  Días crítico (Critical)
                </label>
                <input
                  id="stock_critical_days"
                  type="number"
                  min={1}
                  max={rules.stock_safety_days - 1}
                  value={rules.stock_critical_days}
                  onChange={e => updateField("stock_critical_days", parseInt(e.target.value) || 0)}
                  className="input-mission w-full text-sm"
                />
              </div>
            </div>
          </section>

          {/* ── NPS ─────────────────────────────────────────── */}
          <section className="bg-surface-container-high rounded-xl p-6 space-y-4">
            <h2 className="font-headline font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-lg" aria-hidden="true">star</span>
              NPS & Encuestas
            </h2>
            <div>
              <label className="label-sm text-on-surface-variant block mb-1" htmlFor="nps_cooldown_days">
                Cooldown entre encuestas (días)
              </label>
              <input
                id="nps_cooldown_days"
                type="number"
                min={1}
                value={rules.nps_cooldown_days}
                onChange={e => updateField("nps_cooldown_days", parseInt(e.target.value) || 90)}
                className="input-mission w-full text-sm"
              />
            </div>
          </section>

          {/* ── Submit ──────────────────────────────────────── */}
          <button
            type="submit"
            disabled={saving || rules.stock_critical_days >= rules.stock_safety_days}
            className="btn-volt w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving && (
              <span className="material-symbols-outlined text-sm animate-spin" aria-hidden="true">sync</span>
            )}
            {saving ? "GUARDANDO…" : "GUARDAR CONFIGURACIÓN"}
          </button>
        </form>
      )}
    </div>
  );
}
