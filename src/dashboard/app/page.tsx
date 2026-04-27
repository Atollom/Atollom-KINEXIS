import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart, MessageSquare, Receipt, Brain, Shield, Zap,
  ArrowRight, CheckCircle, TrendingUp, Globe, BarChart3, Users,
  Package, Cpu, Lock,
} from 'lucide-react'
import { LandingNav }           from '@/components/landing/LandingNav'
import { ScreenshotsCarousel }  from '@/components/landing/ScreenshotsCarousel'
import { DemoForm }             from '@/components/landing/DemoForm'

export const metadata: Metadata = {
  title: 'KINEXIS — El ERP Inteligente para E-Commerce en México',
  description:
    'Unifica MercadoLibre, Amazon, Shopify, WhatsApp y CFDI con 43 agentes de IA. La plataforma operativa más avanzada para empresas mexicanas.',
}

// ── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShoppingCart, color: 'text-[#CCFF00] bg-[#CCFF00]/10',
    title: 'E-Commerce Unificado',
    desc: 'MercadoLibre, Amazon y Shopify desde un solo panel. Sincronización de inventario en tiempo real.',
  },
  {
    icon: MessageSquare, color: 'text-blue-400 bg-blue-400/10',
    title: 'CRM Omnicanal',
    desc: 'Inbox unificado de WhatsApp, Instagram y Facebook. Pipeline de ventas con scoring de IA.',
  },
  {
    icon: Receipt, color: 'text-purple-400 bg-purple-400/10',
    title: 'ERP & CFDI 4.0',
    desc: 'Facturación electrónica certificada por el SAT. Contabilidad, finanzas y logística integradas.',
  },
  {
    icon: Brain, color: 'text-pink-400 bg-pink-400/10',
    title: 'Samantha AI',
    desc: '43 agentes especializados que ejecutan acciones reales, no solo conversaciones.',
  },
  {
    icon: Shield, color: 'text-emerald-400 bg-emerald-400/10',
    title: 'Seguridad Bancaria',
    desc: 'Row Level Security, RBAC 5 roles, cifrado en reposo. Arquitectura multi-tenant certificada.',
  },
  {
    icon: Zap, color: 'text-orange-400 bg-orange-400/10',
    title: 'Tiempo Real',
    desc: 'WebSockets, cache Redis, <500ms de latencia. 99.9% uptime garantizado con SLA.',
  },
]

const PLANS = [
  {
    name: 'Starter', price: '$6,500 MXN', period: 'mes',
    desc: 'Para negocios que comienzan',
    features: [
      '1 Módulo a elegir',
      '500 conversaciones Samantha/mes',
      '100 Timbres CFDI',
      '3 usuarios (hasta 10)',
      '50 GB almacenamiento',
      'Soporte email 48h',
    ],
    cta: 'Comenzar ahora', featured: false,
  },
  {
    name: 'Growth', price: '$10,500 MXN', period: 'mes',
    desc: 'Para negocios en expansión',
    features: [
      '2 Módulos a elegir',
      '750 conversaciones Samantha/mes',
      '150 Timbres CFDI',
      '5 usuarios (hasta 20)',
      '100 GB almacenamiento',
      'Soporte chat 24h',
      'Onboarding: Samantha + 1 sesión',
    ],
    cta: 'Solicitar demo', featured: true,
  },
  {
    name: 'Pro', price: '$16,500 MXN', period: 'mes',
    desc: 'Para grandes operaciones',
    features: [
      '3 Módulos (Suite Completa)',
      '1,000 conversaciones Samantha/mes',
      '200 Timbres CFDI',
      'Usuarios ilimitados',
      '200 GB almacenamiento',
      'Soporte WhatsApp 12h',
      'Onboarding: Sesión intensiva 90 min',
    ],
    cta: 'Hablar con ventas', featured: false,
  },
]

const STATS = [
  { v: '43',    l: 'Agentes de IA',       icon: Brain },
  { v: '5',     l: 'Integraciones activas', icon: Globe },
  { v: '99.9%', l: 'Uptime garantizado',   icon: Zap },
  { v: '<500ms',l: 'Latencia promedio',    icon: TrendingUp },
]

const SAMANTHA_BULLETS = [
  'Ejecuta acciones reales en todas tus plataformas',
  'Memoria persistente con contexto de negocio',
  'Orquestación de 43 agentes especializados',
  'Validación RBAC: respeta roles y permisos',
  'Reducción del 70% en tareas operativas repetitivas',
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#040f1b] text-white overflow-x-hidden">
      <LandingNav />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#CCFF00]/5 blur-3xl rounded-full" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#CCFF00] mb-6">
                <Cpu className="w-3.5 h-3.5" />
                43 agentes de IA activos · MVP listo
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                El cerebro<br />
                <span className="text-[#CCFF00]">ejecutor</span> de<br />
                tu e-commerce
              </h1>

              <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
                KINEXIS unifica MercadoLibre, Amazon, Shopify, WhatsApp y CFDI en una sola
                plataforma con 43 agentes de IA. Automatiza operaciones completas, no solo conversaciones.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#demo"
                  className="flex items-center justify-center gap-2 bg-[#CCFF00] text-black font-semibold px-6 py-3.5 rounded-xl hover:bg-[#b8e600] transition-colors"
                >
                  Solicitar Demo Gratis <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Ir al Dashboard
                </Link>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {['O', 'K', 'A'].map((l, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-[#CCFF00]/20 border-2 border-[#040f1b] flex items-center justify-center text-xs font-bold text-[#CCFF00]"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/40">Empresas mexicanas confían en KINEXIS</p>
              </div>
            </div>

            {/* Hero visual — mock dashboard */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#CCFF00]/8 blur-3xl rounded-3xl" />
              <div className="relative rounded-2xl bg-[#040f1b] border border-white/10 overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  <div className="flex-1 mx-4 bg-white/10 rounded-md h-5 flex items-center px-3">
                    <span className="text-xs text-white/30">dashboard.atollom.com</span>
                  </div>
                </div>
                {/* Video Hero */}
                <video
                  src="/videos/hero.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x md:divide-white/5">
            {STATS.map(({ v, l, icon: Icon }, i) => (
              <div key={i} className="text-center md:px-8">
                <Icon className="w-5 h-5 text-[#CCFF00] mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{v}</p>
                <p className="text-sm text-white/40 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Samantha AI ───────────────────────────────────────────────────────── */}
      <section id="samantha" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Chat mock */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/10 to-purple-500/10 blur-3xl rounded-3xl" />
              <div className="relative rounded-2xl bg-[#040f1b] border border-white/10 overflow-hidden">
                <video
                  src="/videos/samantha.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#CCFF00] mb-6">
                <Brain className="w-3.5 h-3.5" />
                Inteligencia artificial nativa
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Samantha ejecuta.<br />
                <span className="text-[#CCFF00]">No solo conversa.</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                A diferencia de los chatbots tradicionales, Samantha tiene acceso directo a tus
                plataformas. Puede timbrar facturas, procesar órdenes, responder clientes y generar
                reportes — todo desde una instrucción en lenguaje natural.
              </p>
              <div className="space-y-3">
                {SAMANTHA_BULLETS.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span className="text-sm text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Screenshots carousel ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Una plataforma, todo tu negocio
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Explora cada módulo de KINEXIS. Desde la primera orden hasta la última factura.
            </p>
          </div>
          <ScreenshotsCarousel />
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Todo lo que necesitas para <span className="text-[#CCFF00]">operar</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Cada módulo diseñado para el mercado mexicano. CFDI 4.0, SAT, y las plataformas
              que ya usas.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-white/20 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Precios transparentes</h2>
            <p className="text-white/60">Sin costos ocultos · Cancela cuando quieras · Prueba 14 días gratis</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 border ${
                  plan.featured
                    ? 'bg-[#CCFF00]/5 border-[#CCFF00]/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#CCFF00] text-black text-xs font-bold px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/40 mb-5">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-white/40 ml-1">/{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href="#demo"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-[#CCFF00] text-black hover:bg-[#b8e600]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo CTA ──────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Solicita tu <span className="text-[#CCFF00]">demo gratuita</span>
            </h2>
            <p className="text-white/60">
              Nuestro equipo te muestra cómo KINEXIS transforma tu operación en 30 minutos.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
            <DemoForm />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Image
                src="/screenshots/logo.webp"
                alt="KINEXIS"
                width={100}
                height={28}
                className="h-7 w-auto mb-3"
                unoptimized
              />
              <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                Plataforma SaaS multi-tenant para empresas de e-commerce en México.
                43 agentes de IA, 0 complejidad operativa.
              </p>
              <p className="text-xs text-white/30 mt-4">contacto@atollom.com</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-3">Producto</p>
              <div className="space-y-2">
                {['Funcionalidades', 'Precios', 'Seguridad', 'API Docs'].map(l => (
                  <p key={l} className="text-sm text-white/40 hover:text-white/70 cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-3">Empresa</p>
              <div className="space-y-2">
                {['Acerca de', 'Blog', 'Contacto', 'Términos y Privacidad'].map(l => (
                  <p key={l} className="text-sm text-white/40 hover:text-white/70 cursor-pointer transition-colors">{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © 2026 Atollom Labs S. de R.L. de C.V. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Lock className="w-3 h-3" />
              <span>Datos protegidos · ISO 27001 · LFPDPPP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
