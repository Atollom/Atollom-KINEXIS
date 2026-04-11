"use client";

import { useState } from "react";
import type { CFDI, CFDIType } from "@/types";
import { CFDIStatusChip } from "./CFDIStatusChip";

const TYPE_LABEL: Record<CFDIType, string> = {
  I: "Ingreso",
  E: "Egreso",
  P: "Pago",
};

const MOCK_CFDIS: CFDI[] = [
  { uuid: "8f2a4e9c-0b1d-4c3e-a5f6-123456789abc", folio: "A-0421", cfdi_type: "I", status: "TIMBRADO",            total: 4200,  customer_rfc: "ROHL790101AB2", timbrado_at: "2026-04-11T09:14:00Z" },
  { uuid: "3d7b8f1a-2c0e-4f5d-b6a7-234567890bcd", folio: "A-0420", cfdi_type: "I", status: "TIMBRADO",            total: 1467,  customer_rfc: "XAXX010101000", timbrado_at: "2026-04-11T08:52:00Z" },
  { uuid: "e1a5c9d2-4b3f-4e8a-c7b0-345678901cde", folio: "A-0419", cfdi_type: "I", status: "ERROR_PAC",           total: 849,   customer_rfc: "GARM850615MX5", timbrado_at: "2026-04-11T08:31:00Z" },
  { uuid: "7f3e1b8d-6c5a-4d9b-d8c1-456789012def", folio: "A-0418", cfdi_type: "I", status: "TIMBRADO",            total: 3299,  customer_rfc: "LOPM910302HJ8", timbrado_at: "2026-04-10T17:45:00Z" },
  { uuid: "c5d9f4a6-8e7b-4b0d-e9d2-567890123efa", folio: "A-0417", cfdi_type: "E", status: "CANCELADO",           total: 489,   customer_rfc: "XAXX010101000", timbrado_at: "2026-04-10T14:22:00Z" },
  { uuid: "2a6b0c7e-a9f8-4c1e-f0e3-678901234fab", folio: "A-0416", cfdi_type: "P", status: "TIMBRADO",            total: 8500,  customer_rfc: "CAHG870924NW3", timbrado_at: "2026-04-10T11:08:00Z" },
  { uuid: "9e4c2d5b-b0a9-4d2f-a1f4-789012345abc", folio: "A-0415", cfdi_type: "I", status: "CANCELACION_PENDIENTE", total: 2199, customer_rfc: "RERJ001201AB1", timbrado_at: "2026-04-09T16:33:00Z" },
  { uuid: "4b8f6e3c-c1b0-4e3a-b2a5-890123456bcd", folio: "A-0414", cfdi_type: "I", status: "TIMBRADO",            total: 299,   customer_rfc: "XAXX010101000", timbrado_at: "2026-04-09T10:17:00Z" },
];

const PAGE_SIZE = 6;

export function CFDITable() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(0);

  const filtered = MOCK_CFDIS.filter(
    (c) =>
      c.uuid.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_rfc.toLowerCase().includes(search.toLowerCase()) ||
      c.folio.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function formatUUID(uuid: string) {
    return uuid.split("-")[0].toUpperCase() + "-…";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <section className="bg-surface-container-high rounded-xl overflow-hidden" aria-label="Tabla de CFDIs">
      {/* Table header */}
      <div className="px-6 py-4 glass-panel flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline font-bold text-sm">CFDIs Recientes</h2>
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Filtrar por UUID o RFC..."
            className="
              bg-surface-container-lowest
              border-b border-outline-variant
              focus:border-primary-container
              text-xs text-on-surface
              placeholder:text-on-surface-variant/40
              placeholder:uppercase placeholder:tracking-widest
              pl-8 pr-4 py-2 rounded-t-sm
              outline-none transition-colors w-64
            "
            aria-label="Buscar CFDIs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" role="table">
          <thead>
            <tr className="border-b border-surface-bright/40">
              {["RFC Cliente", "Tipo", "UUID", "Folio", "Total", "Timbrado", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left label-sm text-on-surface-variant font-medium"
                  scope="col"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((cfdi) => (
              <tr
                key={cfdi.uuid}
                className="border-b border-surface-bright/20 hover:bg-surface-container transition-colors"
              >
                <td className="px-4 py-3 font-mono text-on-surface-variant">{cfdi.customer_rfc}</td>
                <td className="px-4 py-3">
                  <span className="label-sm text-on-surface">{TYPE_LABEL[cfdi.cfdi_type]}</span>
                </td>
                <td className="px-4 py-3 font-mono text-primary-container">{formatUUID(cfdi.uuid)}</td>
                <td className="px-4 py-3 font-mono text-on-surface">{cfdi.folio}</td>
                <td className="px-4 py-3 font-bold text-on-surface">
                  ${cfdi.total.toLocaleString("es-MX")}
                </td>
                <td className="px-4 py-3 text-on-surface-variant text-[10px]">
                  {formatDate(cfdi.timbrado_at)}
                </td>
                <td className="px-4 py-3">
                  <CFDIStatusChip status={cfdi.status} />
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center label-sm text-on-surface-variant">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex items-center gap-2 border-t border-surface-bright/30" aria-label="Paginación">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-glass px-3 py-1.5 disabled:opacity-30"
            aria-label="Página anterior"
          >
            PREV
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded label-sm transition-colors
                ${i === page
                  ? "bg-primary-container text-[#3a4a00]"
                  : "text-on-surface-variant hover:bg-surface-container"
                }`}
              aria-current={i === page ? "page" : undefined}
              aria-label={`Página ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn-glass px-3 py-1.5 disabled:opacity-30"
            aria-label="Página siguiente"
          >
            NEXT
          </button>
        </div>
      )}
    </section>
  );
}
