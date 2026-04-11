import type { Platform } from "@/types";

interface PlatformBadgeProps {
  platform: Platform;
  size?: "sm" | "md";
}

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string }> = {
  ml:      { label: "ML",      color: "text-[#ffe600]", bg: "bg-[#ffe600]/10 border-[#ffe600]/25" },
  amazon:  { label: "AMZ",     color: "text-[#ff9900]", bg: "bg-[#ff9900]/10 border-[#ff9900]/25" },
  shopify: { label: "SHY",     color: "text-[#96bf48]", bg: "bg-[#96bf48]/10 border-[#96bf48]/25" },
  b2b:     { label: "B2B",     color: "text-on-surface-variant", bg: "bg-surface-container-high border-outline-variant/30" },
};

export function PlatformBadge({ platform, size = "sm" }: PlatformBadgeProps) {
  const { label, color, bg } = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`
        inline-flex items-center rounded border
        font-bold font-mono tracking-widest
        ${size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1"}
        ${color} ${bg}
      `}
      aria-label={`Plataforma: ${label}`}
    >
      {label}
    </span>
  );
}
