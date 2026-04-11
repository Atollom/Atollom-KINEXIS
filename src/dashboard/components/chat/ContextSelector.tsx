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
      className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none"
      role="tablist"
      aria-label="Contexto del agente"
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
              flex items-center gap-1.5
              px-3 py-1.5 rounded-full
              label-sm transition-all duration-200
              whitespace-nowrap flex-shrink-0
              ${active
                ? "bg-primary-container text-[#3a4a00] font-bold"
                : "text-on-surface-variant hover:bg-surface-container"
              }
            `}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "13px" }}
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
