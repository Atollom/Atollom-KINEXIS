"use client";

export type ChatContext = "full" | "ecommerce" | "meta" | "erp" | "crm";

interface ContextSelectorProps {
  value: ChatContext;
  onChange: (ctx: ChatContext) => void;
}

const CONTEXTS: { value: ChatContext; label: string; icon: string }[] = [
  { value: "full",      label: "ALL",       icon: "hub" },
  { value: "ecommerce", label: "ECOMMERCE", icon: "shopping_cart" },
  { value: "meta",      label: "META",      icon: "photo_camera" },
  { value: "erp",       label: "ERP",       icon: "receipt_long" },
  { value: "crm",       label: "CRM",       icon: "people" },
];

export function ContextSelector({ value, onChange }: ContextSelectorProps) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar-hidden"
      role="tablist"
    >
      {CONTEXTS.map((ctx) => {
        const active = ctx.value === value;
        return (
          <button
            key={ctx.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(ctx.value)}
            className={`
              flex items-center gap-2
              px-5 py-2.5 rounded-xl
              text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300
              whitespace-nowrap flex-shrink-0
              ${active
                ? "bg-[#ccff00] text-black shadow-[0_0_15px_#ccff0044] italic"
                : "text-white/30 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "14px" }}
              aria-hidden="true"
            >
              {ctx.icon}
            </span>
            {ctx.label}
          </button>
        );
      })}
    </div>
  );
}
