"use client";

import { useEffect, useRef } from "react";
import type { Notification } from "@/types";

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<
  Notification["priority"],
  { dot: string; label: string; border: string }
> = {
  critical: { dot: "bg-error",            label: "text-error",            border: "border-error/20" },
  high:     { dot: "bg-[#ff9900]",        label: "text-[#ff9900]",        border: "border-[#ff9900]/20" },
  medium:   { dot: "bg-secondary",        label: "text-secondary",        border: "border-secondary/20" },
  low:      { dot: "bg-on-surface-variant", label: "text-on-surface-variant", border: "border-outline/10" },
};

const TYPE_ICONS: Record<string, string> = {
  cfdi_error:     "receipt_long",
  stock_critical: "inventory_2",
  return_pending: "assignment_return",
  po_pending:     "shopping_cart",
  crisis_active:  "warning",
};

function formatAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="
        absolute top-full right-0 mt-2 w-80 sm:w-96
        bg-surface-container-high
        border border-outline-variant/20
        rounded-2xl shadow-volt-strong
        z-50 overflow-hidden
      "
      role="dialog"
      aria-label="Panel de notificaciones"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/10">
        <h2 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wider">
          Notificaciones
        </h2>
        {notifications.length > 0 && (
          <span className="label-sm text-on-surface-variant">
            {notifications.length} activas
          </span>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-outline-variant/10">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-surface-container-lowest mt-1.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface-container-lowest rounded w-3/4" />
                  <div className="h-2 bg-surface-container-lowest rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-3xl text-on-surface-variant/30 block mb-2"
              aria-hidden="true"
            >
              notifications_off
            </span>
            <p className="label-sm text-on-surface-variant/40">Sin alertas activas</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg  = PRIORITY_CONFIG[n.priority];
            const icon = TYPE_ICONS[n.type] ?? "info";
            return (
              <div
                key={n.id}
                className={`px-4 py-3 flex gap-3 hover:bg-surface-container transition-colors border-l-2 ${cfg.border}`}
              >
                {/* Icon */}
                <span
                  className={`material-symbols-outlined text-base ${cfg.label} flex-shrink-0 mt-0.5`}
                  aria-hidden="true"
                >
                  {icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface leading-snug">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.label}`}>
                      {n.priority}
                    </span>
                    <span className="text-[9px] text-on-surface-variant/50 ml-auto font-mono">
                      {formatAge(n.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-outline-variant/10">
          <button
            className="label-sm text-on-surface-variant/60 hover:text-primary-container transition-colors w-full text-center"
            onClick={onClose}
          >
            VER TODAS EN /CHAT
          </button>
        </div>
      )}
    </div>
  );
}
