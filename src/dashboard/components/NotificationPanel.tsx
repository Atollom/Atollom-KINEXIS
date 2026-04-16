"use client";

import { useEffect, useRef } from "react";
import type { Notification, NotificationModule } from "@/types";

// ── Module config ─────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<NotificationModule, string> = {
  ecommerce: "Ecommerce",
  erp:       "ERP",
  crm:       "CRM",
  sistema:   "Sistema",
};

const MODULE_COLORS: Record<NotificationModule, string> = {
  ecommerce: "tertiary",
  erp:       "success",
  crm:       "warning",
  sistema:   "primary",
};

// ── Priority / type icon config ───────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  medium:   "#60a5fa",
  low:      "#6b7280",
};

const TYPE_ICON: Record<string, string> = {
  cfdi_error:     "description",
  stock_critical: "inventory_2",
  return_pending: "assignment_return",
  po_pending:     "shopping_basket",
  crisis_active:  "emergency_home",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "ahora";
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function groupByModule(
  notifications: Notification[]
): Map<NotificationModule, Notification[]> {
  const groups = new Map<NotificationModule, Notification[]>();
  for (const n of notifications) {
    const list = groups.get(n.module) ?? [];
    list.push(n);
    groups.set(n.module, list);
  }
  return groups;
}

// ── NotifRow ──────────────────────────────────────────────────────────────────

function NotifRow({
  notif,
  isRead,
  onMarkRead,
}: {
  notif: Notification;
  isRead: boolean;
  onMarkRead: (id: string) => void;
}) {
  const icon  = TYPE_ICON[notif.type] ?? "notifications";
  const color = isRead ? "#617794" : PRIORITY_COLOR[notif.priority];

  return (
    <button
      type="button"
      onClick={() => !isRead && onMarkRead(notif.id)}
      className={`
        w-full text-left flex items-start gap-3
        px-4 py-3 rounded-xl transition-all duration-150
        ${isRead
          ? "opacity-40 cursor-default"
          : "hover:bg-white/[0.06] bg-white/[0.02] cursor-pointer"
        }
      `}
      aria-label={`${isRead ? "Leída" : "Sin leer"}: ${notif.message}`}
    >
      {/* Type icon */}
      <div
        className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ color }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12px] leading-snug ${
            isRead ? "text-on-surface-variant" : "text-on-surface font-medium"
          }`}
        >
          {notif.message}
        </p>
        <p className="text-[10px] text-outline mt-0.5">
          {relativeTime(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <div
          className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: PRIORITY_COLOR[notif.priority],
            boxShadow: `0 0 6px ${PRIORITY_COLOR[notif.priority]}80`,
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// ── NotificationPanel ─────────────────────────────────────────────────────────

export interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  readIds: ReadonlySet<string>;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  notifications,
  isLoading,
  readIds,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const groups = groupByModule(notifications);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Focus panel on mount for keyboard accessibility
  useEffect(() => { panelRef.current?.focus(); }, []);

  // Render order: sistema first (highest priority), then erp, ecommerce, crm
  const MODULE_ORDER: NotificationModule[] = ["sistema", "erp", "ecommerce", "crm"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panel de notificaciones"
        tabIndex={-1}
        className="
          fixed right-0 top-16 bottom-0 z-50
          w-full sm:w-[400px]
          flex flex-col
          bg-[#0A1628]/98 backdrop-blur-2xl
          border-l border-white/[0.06]
          shadow-2xl outline-none
        "
        style={{ animation: "slideInRight 0.2s ease-out" }}
      >
        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined text-[#A8E63D] text-xl"
              aria-hidden="true"
            >
              notifications
            </span>
            <h2 className="font-headline font-bold text-on-surface text-sm">
              Notificaciones
            </h2>
            {unreadCount > 0 && (
              <span
                className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                aria-label={`${unreadCount} sin leer`}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[10px] font-bold text-on-surface-variant hover:text-[#A8E63D] transition-colors uppercase tracking-wider"
                aria-label="Marcar todas como leídas"
              >
                Leer todo
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] transition-all"
              aria-label="Cerrar panel de notificaciones"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2" role="list" aria-label="Lista de notificaciones">
          {isLoading ? (
            <div className="px-5 py-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/[0.06] rounded w-full" />
                    <div className="h-2 bg-white/[0.04] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant gap-3">
              <span
                className="material-symbols-outlined text-4xl opacity-30"
                aria-hidden="true"
              >
                notifications_off
              </span>
              <p className="text-sm">Sin notificaciones activas</p>
            </div>
          ) : (
            MODULE_ORDER.map((mod) => {
              const items = groups.get(mod);
              if (!items?.length) return null;
              const modColor = MODULE_COLORS[mod];

              return (
                <div key={mod} className="mb-2" role="group" aria-label={`Módulo ${MODULE_LABELS[mod]}`}>
                  {/* Module separator */}
                  <div className="flex items-center gap-2 px-5 py-2">
                    <div
                      className="h-px flex-1 rounded-full"
                      style={{ backgroundColor: `${modColor}25` }}
                    />
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: modColor }}
                    >
                      {MODULE_LABELS[mod]}
                    </span>
                    <div
                      className="h-px flex-1 rounded-full"
                      style={{ backgroundColor: `${modColor}25` }}
                    />
                  </div>

                  {/* Items */}
                  <div className="px-2 space-y-0.5" role="list">
                    {items.map((notif) => (
                      <div key={notif.id} role="listitem">
                        <NotifRow
                          notif={notif}
                          isRead={readIds.has(notif.id)}
                          onMarkRead={onMarkRead}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ──────────────────────────── */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-[10px] text-outline text-center">
              {unreadCount === 0
                ? "Todas las notificaciones están leídas ✓"
                : `${unreadCount} sin leer · Clic para marcar como leída`}
            </p>
          </div>
        )}
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
