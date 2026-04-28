'use client'

import { Home, ShoppingCart, Package, Users } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { name: 'INSIGHTS', href: '/dashboard', icon: Home },
  { name: 'VENTAS',   href: '/ecommerce', icon: ShoppingCart },
  { name: 'OPS',      href: '/erp',       icon: Package },
  { name: 'CLIENTE',  href: '/crm',       icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        backgroundColor: 'var(--background)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
      }}
    >
      <div className="flex items-stretch justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 active:scale-90"
            >
              {/* Active indicator line at top */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300"
                style={{
                  width: isActive ? '32px' : '0px',
                  backgroundColor: 'var(--accent-primary)',
                }}
              />

              <Icon
                style={{
                  width: '20px',
                  height: '20px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  strokeWidth: isActive ? 2.5 : 1.75,
                  transition: 'color 0.2s, transform 0.2s',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
