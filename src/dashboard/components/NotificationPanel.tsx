"use client";

import { useEffect, useRef } from "react";
import type { Notification, NotificationModule } from "@/types";

// ── Module config ─────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<NotificationModule, string> = {
  ecommerce: "ECOMMERCE",
  erp:       "ERP",
  crm:       "CRM",
  sistema:   "SYSTEM",
};

const MODULE_COLORS: Record<NotificationModule, string> = {
  ecommerce: "#ccff00",
  erp:       "#ffffff",
  crm:       "#ffffff",
  sistema:   "#ccff00",
};

// ── Priority / type icon config ───────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  medium:   "#ccff00",
  low:      "#ffffff",
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
  if (mins  < 1)  return "NOW";
  if (mins  < 60) return `${mins}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  return `${days}D AGO`;
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
  const color = isRead ? "rgba(255,255,255,0.2)" : PRIORITY_COLOR[notif.priority];

  return (
    <button
      type="button"
      onClick={() => !isRead && onMarkRead(notif.id)}
      className={`
        w-full text-left flex items-start gap-4
        px-6 py-5 rounded-[1.5rem] transition-all duration-500 border group scale-[0.99] hover:scale-[1]
        ${isRead
          ? "opacity-30 cursor-default border-transparent"
          : "hover:bg-white/[0.04] bg-white/[0.02] border-white/5 cursor-pointer shadow-xl hover:border-white/10"
        }
      `}
      aria-label={`${isRead ? "Read" : "Unread"}: ${notif.message}`}
    >
      {/* Type icon */}
      <div
        className="mt-1 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-white/10 transition-all"
        style={{ backgroundColor: isRead ? 'transparent' : `${color}10` }}
      >
        <span
          className="material-symbols-outlined text-lg"
          style={{ color }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[12px] leading-relaxed font-black uppercase tracking-tight ${
            isRead ? "text-white/40" : "text-white group-hover:text-[#ccff00] transition-colors"
          }`}
        >
          {notif.message}
        </p>
        <p className="text-[9px] font-black text-white/10 mt-2 uppercase tracking-[0.2em] italic">
          {relativeTime(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!isRead && (
        <div
          className="mt-3 w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse shadow-lg"
          style={{
            backgroundColor: PRIORITY_COLOR[notif.priority],
            boxShadow: `0 0 10px ${PRIORITY_COLOR[notif.priority]}`,
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

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => { panelRef.current?.focus(); }, []);

  const MODULE_ORDER: NotificationModule[] = ["sistema", "erp", "ecommerce", "crm"];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all duration-700"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Neural Notification Matrix"
        tabIndex={-1}
        className="
          fixed right-0 top-0 bottom-0 z-50
          w-full sm:w-[460px]
          flex flex-col
          bg-[#000000]/80 backdrop-blur-[60px]
          border-l border-white/5
          shadow-2xl outline-none
          animate-in slide-in-from-right-full duration-700 ease-luxe
        "
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* ── Header ──────────────────────────── */}
        <div className="flex items-center justify-between px-10 py-10 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
               <span className="material-symbols-outlined text-[#ccff00] text-xl shadow-volt" aria-hidden="true">notifications</span>
            </div>
            <div>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Signal Logs</h2>
               <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Real-time Entropy Filter</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
               onClick={onClose}
               className="w-10 h-10 rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
               aria-label="Exit Matrix"
             >
               <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar relative z-10" role="list" aria-label="Incoming Signals">
          {isLoading ? (
            <div className="px-5 py-8 space-y-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse opacity-20">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-2.5 bg-white/10 rounded-full w-full" />
                    <div className="h-2 bg-white/5 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-10 gap-6">
              <span className="material-symbols-outlined text-6xl" aria-hidden="true">notifications_off</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Entropy Branch</p>
            </div>
          ) : (
            <>
               <div className="px-4 flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] italic">{unreadCount} Critical Unreads</span>
                  {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[9px] font-black text-[#ccff00] uppercase tracking-widest hover:underline decoration-[#ccff00]/20 underline-offset-8 transition-all"
                  >
                    RESOLVE ALL SIGNALS
                  </button>
                )}
               </div>

               {MODULE_ORDER.map((mod) => {
                 const items = groups.get(mod);
                 if (!items?.length) return null;
                 const modColor = MODULE_COLORS[mod];

                 return (
                   <div key={mod} className="space-y-4" role="group" aria-label={`${MODULE_LABELS[mod]} Block`}>
                     <div className="flex items-center gap-3 px-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none" style={{ color: modColor }}>{MODULE_LABELS[mod]}</span>
                       <div className="h-px flex-1 bg-white/5" />
                     </div>

                     <div className="space-y-3" role="list">
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
               })}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────── */}
        <div className="px-10 py-10 border-t border-white/5 flex-shrink-0 bg-black/40 z-10">
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] text-center italic">
            Neural Signal Intercept v4.2.1
          </p>
        </div>
      </div>
    </>
  );
}
