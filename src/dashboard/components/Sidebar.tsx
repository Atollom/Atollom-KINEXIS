"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/ecommerce", label: "Ecommerce", icon: "shopping_cart" },
  { href: "/meta",      label: "Meta",      icon: "language" },
  { href: "/erp",       label: "ERP",       icon: "account_tree" },
  { href: "/crm",       label: "CRM",       icon: "contact_page" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navegación principal"
      className="
        hidden md:flex
        fixed left-0 top-0 h-full z-50
        flex-col
        w-64
        bg-surface-container-low
        shadow-volt
      "
    >
      {/* Logo */}
      <div className="px-8 pt-8 pb-2">
        <Link
          href="/"
          className="
            block text-2xl font-bold tracking-tight
            text-primary font-headline
            hover:text-primary-container transition-colors
          "
        >
          KINEXIS
        </Link>
      </div>

      {/* User card */}
      <div className="px-8 py-6">
        <div className="flex items-center gap-3">
          <div
            className="
              w-10 h-10 rounded-full flex-shrink-0
              bg-surface-container-highest
              flex items-center justify-center
              border border-outline-variant
              text-on-surface-variant
            "
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-base">person</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold font-headline text-on-surface truncate">
              Neural Commander
            </div>
            <div className="label-sm text-on-surface-variant mt-0.5">
              Socias Role
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col px-4 gap-1 flex-1" aria-label="Módulos">
        <p className="label-sm text-on-surface-variant px-4 mb-3">ROUTERS</p>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          // Match root "/" to ecommerce for default highlight
          const isActive =
            pathname === href ||
            (pathname === "/" && href === "/ecommerce");

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                font-headline font-bold text-sm tracking-tight
                transition-all duration-200
                ${
                  isActive
                    ? "bg-surface-container-high text-primary-container border-r-2 border-primary-container"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-bright"
                }
              `}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* System status footer */}
      <div className="px-8 py-6">
        <p className="label-sm text-outline mb-3">SYSTEM STATUS</p>
        <div className="flex items-center gap-2">
          <div
            className="relative w-2 h-2 rounded-full bg-primary-container"
            aria-label="Sistema activo"
          >
            <div className="absolute inset-0 rounded-full bg-primary-container animate-ping opacity-60" />
          </div>
          <span className="text-xs font-bold text-primary-container">
            Active Session
          </span>
        </div>
        <div className="mt-4 bg-surface-container-high p-3 rounded-xl">
          <p className="label-sm text-on-surface-variant mb-2">NEURAL LOAD</p>
          <div className="h-1 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full w-2/3 bg-primary-container"
              style={{ boxShadow: "0 0 5px #cafd00" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
