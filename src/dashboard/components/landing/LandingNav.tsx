'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Samantha AI',    href: '#samantha' },
  { label: 'Precios',        href: '#pricing' },
  { label: 'Demo',           href: '#demo' },
]

export function LandingNav() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#040f1b]/90 backdrop-blur-md border-b border-white/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/screenshots/logo.webp"
              alt="KINEXIS"
              width={160}
              height={44}
              className="h-10 w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              Iniciar Sesión
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-1.5 bg-[#CCFF00] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#b8e600] transition-colors"
            >
              Solicitar Demo <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white/60 hover:text-white"
            aria-label="Menú"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#040f1b]/95 backdrop-blur-md border-b border-white/10 px-4 pb-4">
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-white/60 hover:text-white border-b border-white/5 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 mt-4">
            <Link
              href="/login"
              className="flex-1 text-center text-sm text-white/60 border border-white/20 rounded-lg py-2 hover:border-white/40"
            >
              Iniciar Sesión
            </Link>
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="flex-1 text-center bg-[#CCFF00] text-black text-sm font-semibold rounded-lg py-2"
            >
              Solicitar Demo
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
