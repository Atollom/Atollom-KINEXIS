"use client";

import { useState, useEffect } from "react";
import { OrderCard, type LiveOrder } from "./OrderCard";
import type { Platform } from "@/types";

// Mock orders for development
const MOCK_ORDERS: LiveOrder[] = [
  { id: "1",  external_id: "3109228834", platform: "ml",      product: "Pinzas Precisión RC-02 (x3)", total: 1467, status: "PENDIENTE", customer: "Roberto Hdz", minutes_ago: 2  },
  { id: "2",  external_id: "702-4453821", platform: "amazon",  product: "Kit Herramientas KT-07",        total: 849,  status: "ETIQUETA",  customer: "Ana Garza",    minutes_ago: 5  },
  { id: "3",  external_id: "SHY-10042",  platform: "shopify", product: "Cortadora Multipropósito CM-1",  total: 2199, status: "PENDIENTE", customer: "Luis Reyes",   minutes_ago: 9  },
  { id: "4",  external_id: "3109228912", platform: "ml",      product: "Taladro Inalámbrico T-12",       total: 3299, status: "ENVIADO",   customer: "María López",  minutes_ago: 14 },
  { id: "5",  external_id: "702-4453905", platform: "amazon",  product: "Pinzas Precisión RC-02",         total: 489,  status: "PENDIENTE", customer: "Carlos Ménd.", minutes_ago: 18 },
  { id: "6",  external_id: "3109229100", platform: "ml",      product: "Destornillador Magnético DM-4",  total: 299,  status: "ETIQUETA",  customer: "Sofia Castro", minutes_ago: 22 },
  { id: "7",  external_id: "SHY-10043",  platform: "shopify", product: "Kit Precisión Pro x5",           total: 1850, status: "ENVIADO",   customer: "Juan Torres",  minutes_ago: 30 },
  { id: "8",  external_id: "3109229244", platform: "ml",      product: "Alicates Combinados AC-2",       total: 540,  status: "PENDIENTE", customer: "Rosa Flores",  minutes_ago: 35 },
];

const ML_QUESTIONS = [
  { id: "q1", product: "Pinzas RC-02",    question: "¿Tienen para envío inmediato?",                  time: "4m"  },
  { id: "q2", product: "Kit KT-07",       question: "¿Incluye garantía del fabricante?",              time: "11m" },
  { id: "q3", product: "Taladro T-12",    question: "¿Funciona con voltaje 127v y 220v?",             time: "25m" },
];

type FilterPlatform = "all" | Platform;

export function MLFeed() {
  const [filter, setFilter] = useState<FilterPlatform>("all");
  const [orders, setOrders] = useState<LiveOrder[]>(MOCK_ORDERS);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate live feed refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In production: re-fetch from /api/warehouse/tasks
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.platform === filter);

  const counts = {
    ml:      orders.filter((o) => o.platform === "ml").length,
    amazon:  orders.filter((o) => o.platform === "amazon").length,
    shopify: orders.filter((o) => o.platform === "shopify").length,
  };

  return (
    <div className="space-y-6">
      {/* Live Orders Feed */}
      <section className="bg-surface-container-high rounded-xl overflow-hidden" aria-label="Órdenes en tiempo real">
        {/* Header */}
        <div className="px-6 py-4 glass-panel flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-headline font-bold text-base tracking-tight">
              Live Orders Feed
            </h2>
            <span className="chip-active">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" aria-hidden="true" />
              STREAM: ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
            <span className="material-symbols-outlined text-xs" aria-hidden="true">schedule</span>
            Actualizado: {lastUpdated.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Platform filter tabs */}
        <div className="px-6 py-3 flex items-center gap-2 border-b border-surface-bright/40">
          {(["all", "ml", "amazon", "shopify"] as FilterPlatform[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`
                label-sm px-3 py-1.5 rounded-lg transition-all
                ${filter === p
                  ? "bg-surface-container-high text-primary-container"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }
              `}
              aria-pressed={filter === p}
            >
              {p === "all" ? `TODAS (${orders.length})` :
               p === "ml" ? `ML (${counts.ml})` :
               p === "amazon" ? `AMAZON (${counts.amazon})` :
               `SHOPIFY (${counts.shopify})`}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="p-4 space-y-2" role="table" aria-label="Lista de órdenes">
          {filtered.length === 0 && (
            <p className="py-8 text-center label-sm text-on-surface-variant">
              Sin órdenes activas
            </p>
          )}
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      {/* ML Questions mini-panel */}
      <section className="bg-surface-container-high rounded-xl overflow-hidden" aria-label="Preguntas ML sin responder">
        <div className="px-6 py-4 flex items-center justify-between glass-panel">
          <h2 className="font-headline font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg" aria-hidden="true">forum</span>
            Preguntas ML sin responder
          </h2>
          <span className="chip-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true" />
            {ML_QUESTIONS.length} PENDIENTES
          </span>
        </div>
        <div className="p-4 space-y-2">
          {ML_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-bright transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0" aria-hidden="true">
                  help_outline
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-primary-container font-mono">{q.product}</p>
                  <p className="text-xs text-on-surface truncate max-w-[280px]">{q.question}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="label-sm text-outline">{q.time}</span>
                <button
                  className="label-sm text-primary-container hover:underline transition-colors"
                  aria-label={`Responder: ${q.question}`}
                >
                  RESPONDER
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
