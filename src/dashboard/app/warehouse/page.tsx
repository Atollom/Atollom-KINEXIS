"use client";

import { useState, useEffect } from "react";
import { CutoffAlert } from "@/components/warehouse/CutoffAlert";
import { TaskCard, type WarehouseTask } from "@/components/warehouse/TaskCard";

function getMxTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })
  );
}

const MOCK_TASKS: WarehouseTask[] = [
  {
    order_id: "ord-1",
    external_id: "3109228834",
    platform: "ml",
    priority: 1,
    customer_name: "Roberto Hernández",
    products: [
      { name: "Pinzas de Precisión RC-02", qty: 3 },
      { name: "Destornillador Magnético DM-4", qty: 1 },
    ],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-2",
    external_id: "702-4453821",
    platform: "amazon",
    priority: 2,
    customer_name: "Ana Garza",
    products: [{ name: "Kit Herramientas KT-07", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-3",
    external_id: "3109228912",
    platform: "ml",
    priority: 1,
    customer_name: "María López",
    products: [{ name: "Taladro Inalámbrico T-12", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "printed",
  },
  {
    order_id: "ord-4",
    external_id: "SHY-10042",
    platform: "shopify",
    priority: 3,
    customer_name: "Luis Reyes",
    address: "Calle Insurgentes Sur 1045, Benito Juárez, CDMX",
    products: [{ name: "Cortadora Multipropósito CM-1", qty: 1 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    order_id: "ord-5",
    external_id: "702-4453905",
    platform: "amazon",
    priority: 2,
    customer_name: "Carlos Méndez",
    products: [{ name: "Pinzas de Precisión RC-02", qty: 2 }],
    created_at: new Date().toISOString(),
    status: "pending",
  },
];

export default function WarehousePage() {
  const [tasks, setTasks] = useState<WarehouseTask[]>(MOCK_TASKS);
  const [now, setNow] = useState(getMxTime());

  useEffect(() => {
    const id = setInterval(() => setNow(getMxTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  function handleConfirm(orderId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.order_id === orderId ? { ...t, status: "confirmed" } : t))
    );
  }

  const pending   = tasks.filter((t) => t.status !== "confirmed").length;
  const confirmed = tasks.filter((t) => t.status === "confirmed").length;
  const mlCount      = tasks.filter((t) => t.platform === "ml"      && t.status !== "confirmed").length;
  const amazonCount  = tasks.filter((t) => t.platform === "amazon"  && t.status !== "confirmed").length;
  const shopifyCount = tasks.filter((t) => t.platform === "shopify" && t.status !== "confirmed").length;

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header>
        <h1 className="font-headline text-4xl font-black tracking-tight text-on-surface uppercase">
          ALMACÉN
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-on-surface-variant">Buenos días, Carlos</p>
          <p className="label-sm text-outline">
            {now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} CDMX
          </p>
        </div>
      </header>

      {/* ── ML Cutoff alert ─────────────────────────────────────────── */}
      <CutoffAlert />

      {/* ── Day summary chips ────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-3" aria-label="Resumen del día">
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-bold text-[#ffe600]">{mlCount}</p>
          <p className="label-sm text-on-surface-variant mt-1">ML</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-bold text-[#ff9900]">{amazonCount}</p>
          <p className="label-sm text-on-surface-variant mt-1">Amazon</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 text-center">
          <p className="text-2xl font-headline font-bold text-[#96bf48]">{shopifyCount}</p>
          <p className="label-sm text-on-surface-variant mt-1">Shopify</p>
        </div>
      </section>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="label-sm text-on-surface-variant">
            PROGRESO DEL DÍA
          </p>
          <p className="label-sm text-primary-container">
            {confirmed}/{tasks.length} COMPLETADOS
          </p>
        </div>
        <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container rounded-full transition-all duration-500"
            style={{
              width: `${tasks.length > 0 ? (confirmed / tasks.length) * 100 : 0}%`,
              boxShadow: confirmed > 0 ? "0 0 6px #cafd00" : "none",
            }}
            role="progressbar"
            aria-valuenow={confirmed}
            aria-valuemin={0}
            aria-valuemax={tasks.length}
            aria-label={`${confirmed} de ${tasks.length} órdenes completadas`}
          />
        </div>
      </div>

      {/* ── Task list ────────────────────────────────────────────────── */}
      <section
        className="space-y-4"
        aria-label={`${pending} órdenes pendientes`}
      >
        <div className="flex items-center justify-between">
          <h2 className="label-sm text-on-surface-variant">
            ÓRDENES PENDIENTES ({pending})
          </h2>
        </div>

        {tasks.map((task) => (
          <TaskCard key={task.order_id} task={task} onConfirm={handleConfirm} />
        ))}

        {pending === 0 && (
          <div className="py-12 text-center bg-surface-container-high rounded-xl">
            <span className="material-symbols-outlined text-4xl text-primary-container block mb-3">
              check_circle
            </span>
            <p className="font-headline font-bold text-xl text-on-surface">¡Todo surtido!</p>
            <p className="label-sm text-on-surface-variant mt-2">
              {confirmed} órdenes completadas hoy
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
