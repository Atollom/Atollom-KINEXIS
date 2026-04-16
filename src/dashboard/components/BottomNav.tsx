"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomItem {
  href: string;
  label: string;
  icon: string;
}

const BOTTOM_ITEMS: BottomItem[] = [
  { href: "/",         label: "Core",    icon: "gpp_good" },
  { href: "/status",   label: "Status",  icon: "data_exploration" },
  { href: "/search",   label: "Search",  icon: "search" },
  { href: "/health",   label: "Nodes",   icon: "sensors" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Neural Mobile Navigation"
      className="
        fixed bottom-0 left-0 right-0 z-50
        flex justify-around items-center
        h-24 px-6
        bg-black/80 backdrop-blur-[40px]
        border-t border-white/5
        shadow-[0_-4px_30px_rgba(204,255,0,0.05)]
        md:hidden overflow-hidden
      "
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-12 bg-[#ccff00]/5 blur-[40px] pointer-events-none" />
      
      {BOTTOM_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex flex-col items-center justify-center gap-1.5
              px-6 py-2.5 rounded-2xl
              transition-all duration-500 active:scale-90 relative
              ${
                isActive
                  ? "bg-[#ccff00] text-black shadow-volt"
                  : "text-white/20 hover:text-white"
              }
            `}
          >
            <span
              className={`material-symbols-outlined text-xl italic font-black ${isActive ? 'shadow-volt-text' : ''}`}
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">
              {label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 bg-black rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
