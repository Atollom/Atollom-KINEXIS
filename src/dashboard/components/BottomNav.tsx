"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomItem {
  href: string;
  label: string;
  icon: string;
}

const BOTTOM_ITEMS: BottomItem[] = [
  { href: "/",         label: "Guardian", icon: "gpp_good" },
  { href: "/status",   label: "Status",   icon: "data_exploration" },
  { href: "/search",   label: "Search",   icon: "search" },
  { href: "/health",   label: "Health",   icon: "sensors" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="
        fixed bottom-0 left-0 right-0 z-50
        flex justify-around items-center
        h-20 px-4
        bg-surface-container-low/90 backdrop-blur-xl
        border-t border-surface-bright
        shadow-[0_-4px_12px_rgba(202,253,0,0.08)]
        md:hidden
      "
    >
      {BOTTOM_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex flex-col items-center justify-center gap-1
              px-4 py-1 rounded-xl
              label-sm
              transition-all duration-200 active:scale-95
              ${
                isActive
                  ? "bg-primary-container text-[#3a4a00]"
                  : "text-on-surface-variant hover:text-primary"
              }
            `}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              {icon}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
