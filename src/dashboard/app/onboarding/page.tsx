'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import {
  Building2, Receipt, Users, Rocket, ArrowRight, ArrowLeft,
  Check, Plus, Trash2, Sparkles, ChevronDown,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'empresa' | 'facturacion' | 'equipo' | 'lanzar'
interface TeamMember { name: string; email: string; role: string }
interface FormData {
  company_name: string; industry: string; company_size: string
  company_phone: string; company_email: string
  rfc: string; razon_social: string; regimen_fiscal: string; lugar_expedicion: string
  team: TeamMember[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; Icon: React.ElementType }[] = [
  { id: 'empresa',     label: 'Empresa',     Icon: Building2 },
  { id: 'facturacion', label: 'Facturación', Icon: Receipt   },
  { id: 'equipo',      label: 'Equipo',      Icon: Users     },
  { id: 'lanzar',      label: 'Lanzar',      Icon: Rocket    },
]

const INDUSTRIES = [
  'Herramientas / Ferretería', 'Equipo Médico', 'Tecnología / Electrónica',
  'Moda / Ropa / Calzado', 'Alimentos / Bebidas', 'Construcción / Materiales',
  'Farmacia / Salud', 'Muebles / Hogar', 'Automotriz / Refacciones', 'Otro',
]

const SIZES = ['1 – 5', '6 – 20', '21 – 100', '101 – 500', '500+']

const REGIMENES = [
  { code: '601', label: '601 — General de Ley Personas Morales' },
  { code: '612', label: '612 — Personas Físicas con Actividades Empresariales' },
  { code: '616', label: '616 — Sin obligaciones fiscales' },
  { code: '621', label: '621 — Incorporación Fiscal' },
  { code: '626', label: '626 — RESICO — Régimen Simplificado de Confianza' },
]

const ROLES = [
  { value: 'admin',       label: 'Administrador'  },
  { value: 'agente',      label: 'Agente de Ventas' },
  { value: 'almacenista', label: 'Almacenista'    },
  { value: 'contador',    label: 'Contador'       },
]

const SAMANTHA: Record<Step, { greeting: string; body: string; tip?: string }> = {
  empresa: {
    greeting: 'Bienvenido a KINEXIS',
    body: 'Soy Samantha, su asistente ejecutiva. En los próximos minutos configuraré su negocio completo para que empiece a operar de inmediato.\n\nComencemos por lo más importante: su empresa.',
    tip: 'Esta información personaliza todos los módulos: e-commerce, CRM, facturación y logística.',
  },
  facturacion: {
    greeting: 'Configuración fiscal',
    body: 'Con su RFC configurado, KINEXIS emitirá CFDIs de manera automática y mantendrá cumplimiento ante el SAT desde el primer día.\n\nNo tendrá que preocuparse por lo fiscal — yo me encargo.',
    tip: 'RFC de persona moral: AAA010101AAA · Persona física: XAXX010101000',
  },
  equipo: {
    greeting: 'Su equipo en KINEXIS',
    body: 'Invite a las personas que necesitan acceso. Recibirán sus credenciales por email y podrán trabajar de inmediato.\n\nEste paso es opcional — puede hacerlo después desde Configuración → Usuarios.',
    tip: 'Cada rol tiene permisos precisos: el almacenista ve inventario, el contador ve finanzas.',
  },
  lanzar: {
    greeting: '¡Todo listo para despegar!',
    body: 'Revisé su información y está perfecta. Con un clic activaré su cuenta, configuraré todos los módulos y estaré disponible en el dashboard para asistirle en lo que necesite.\n\n¿Entramos?',
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                   placeholder:text-gray-300 transition" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void
  options: (string | { code: string; label: string })[]; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white
                     text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                     focus:border-transparent cursor-pointer transition">
          <option value="">Seleccionar…</option>
          {options.map(o => {
            const val = typeof o === 'string' ? o : o.code
            const lbl = typeof o === 'string' ? o : o.label
            return <option key={val} value={val}>{lbl}</option>
          })}
        </select>
        <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step,       setStep]       = useState<Step>('empresa')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [userEmail,  setUserEmail]  = useState('')
  const [userName,   setUserName]   = useState('')
  const [form, setForm] = useState<FormData>({
    company_name: '', industry: '', company_size: '', company_phone: '', company_email: '',
    rfc: '', razon_social: '', regimen_fiscal: '', lugar_expedicion: '',
    team: [],
  })

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? '')
        setUserName(
          (session.user.user_metadata?.full_name as string | undefined) ??
          session.user.email?.split('@')[0] ?? 'Usuario'
        )
      }
    })
  }, [])

  const patch = (p: Partial<FormData>) => setForm(f => ({ ...f, ...p }))
  const stepIndex = STEPS.findIndex(s => s.id === step)
  const sam       = SAMANTHA[step]

  function canAdvance(): boolean {
    if (step === 'empresa')     return !!form.company_name.trim() && !!form.industry
    if (step === 'facturacion') return !!form.rfc.trim() && !!form.razon_social.trim() && !!form.regimen_fiscal
    return true
  }

  function next() {
    if (!canAdvance()) return
    const i = STEPS.findIndex(s => s.id === step)
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].id)
  }

  function prev() {
    const i = STEPS.findIndex(s => s.id === step)
    if (i > 0) setStep(STEPS[i - 1].id)
  }

  async function submit() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            name:         form.company_name,
            phone:        form.company_phone || undefined,
            email:        form.company_email || userEmail || undefined,
            industry:     form.industry,
            company_size: form.company_size || undefined,
          },
          billing: {
            rfc:              form.rfc.toUpperCase(),
            razon_social:     form.razon_social,
            regimen_fiscal:   form.regimen_fiscal,
            lugar_expedicion: form.lugar_expedicion || undefined,
          },
          ecommerce: {}, messaging: {}, platforms: [],
          users: [
            { full_name: userName, email: userEmail, role: 'owner' },
            ...form.team.filter(m => m.email.trim() && m.name.trim()),
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || data.error || 'Error al configurar la cuenta'); return }
      router.push('/dashboard?onboarded=1')
    } catch {
      setError('Error de conexión. Por favor intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* ── Form side ─────────────────────────────────────────────────── */}
        <div className="flex-1 p-8 flex flex-col gap-6" style={{ minHeight: 600 }}>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done    = i < stepIndex
              const current = s.id === step
              const { Icon } = s
              return (
                <div key={s.id} className="flex items-center gap-1.5 flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                    ${done ? 'bg-green-600 text-white' : current ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${current ? 'text-green-700' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
          </div>

          {/* Step content */}
          <div className="flex-1 flex flex-col gap-5">

            {step === 'empresa' && (<>
              <h2 className="text-xl font-bold text-gray-900">Cuéntenos sobre su empresa</h2>
              <Field label="Nombre de la empresa" value={form.company_name}
                     onChange={v => patch({ company_name: v })} required placeholder="Ej. Distribuidora Norte SA de CV" />
              <SelectField label="Industria" value={form.industry}
                           onChange={v => patch({ industry: v })} options={INDUSTRIES} required />
              <SelectField label="Tamaño del equipo" value={form.company_size}
                           onChange={v => patch({ company_size: v })} options={SIZES} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono" value={form.company_phone}
                       onChange={v => patch({ company_phone: v })} placeholder="+52 55 1234 5678" />
                <Field label="Email empresa" type="email" value={form.company_email}
                       onChange={v => patch({ company_email: v })} placeholder="contacto@empresa.com" />
              </div>
            </>)}

            {step === 'facturacion' && (<>
              <h2 className="text-xl font-bold text-gray-900">Configuración fiscal</h2>
              <Field label="RFC" value={form.rfc}
                     onChange={v => patch({ rfc: v.toUpperCase() })} required placeholder="AAA010101AAA" />
              <Field label="Razón Social" value={form.razon_social}
                     onChange={v => patch({ razon_social: v })} required placeholder="Como aparece ante el SAT" />
              <SelectField label="Régimen Fiscal" value={form.regimen_fiscal}
                           onChange={v => patch({ regimen_fiscal: v })} options={REGIMENES} required />
              <Field label="Código Postal de Expedición" value={form.lugar_expedicion}
                     onChange={v => patch({ lugar_expedicion: v })} placeholder="06600" />
            </>)}

            {step === 'equipo' && (<>
              <h2 className="text-xl font-bold text-gray-900">Invitar al equipo</h2>
              {form.team.length === 0 && (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
                  Sin miembros adicionales aún. Puede agregar su equipo más adelante.
                </p>
              )}
              {form.team.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                  <Field label={i === 0 ? 'Nombre' : ''} value={m.name}
                         onChange={v => { const t = [...form.team]; t[i] = { ...t[i], name: v }; patch({ team: t }) }}
                         placeholder="Nombre completo" />
                  <Field label={i === 0 ? 'Email' : ''} type="email" value={m.email}
                         onChange={v => { const t = [...form.team]; t[i] = { ...t[i], email: v }; patch({ team: t }) }}
                         placeholder="email@empresa.com" />
                  <div className="flex flex-col gap-1">
                    {i === 0 && <label className="text-sm font-medium text-gray-700">Rol</label>}
                    <select value={m.role}
                      onChange={e => { const t = [...form.team]; t[i] = { ...t[i], role: e.target.value }; patch({ team: t }) }}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <button onClick={() => patch({ team: form.team.filter((_, idx) => idx !== i) })}
                    className={`p-2.5 rounded-xl text-red-400 hover:bg-red-50 transition ${i === 0 ? 'mt-5' : ''}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => patch({ team: [...form.team, { name: '', email: '', role: 'agente' }] })}
                className="flex items-center gap-2 text-sm text-green-700 font-medium hover:text-green-800 transition w-fit">
                <Plus className="w-4 h-4" /> Agregar miembro
              </button>
            </>)}

            {step === 'lanzar' && (<>
              <h2 className="text-xl font-bold text-gray-900">Resumen de configuración</h2>
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <SummaryRow label="Empresa"        value={form.company_name} />
                <SummaryRow label="Industria"      value={form.industry} />
                <SummaryRow label="RFC"            value={form.rfc || '—'} />
                <SummaryRow label="Razón Social"   value={form.razon_social || '—'} />
                <SummaryRow label="Régimen Fiscal" value={form.regimen_fiscal || '—'} />
                <SummaryRow label="Equipo"         value={`${form.team.length + 1} usuario${form.team.length + 1 !== 1 ? 's' : ''}`} />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            </>)}

          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <button onClick={prev} disabled={stepIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100
                         disabled:opacity-0 transition text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
            {step !== 'lanzar' ? (
              <button onClick={next} disabled={!canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700
                           text-white font-medium text-sm disabled:opacity-40 transition">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700
                           text-white font-semibold text-sm disabled:opacity-60 transition shadow-lg shadow-green-200">
                {submitting ? 'Configurando…' : <><Rocket className="w-4 h-4" /> Activar KINEXIS</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Samantha side ─────────────────────────────────────────────── */}
        <div className="w-full md:w-72 bg-gradient-to-b from-green-700 to-green-900 p-7 flex flex-col gap-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Samantha</p>
              <p className="text-xs text-green-200">Asistente Ejecutiva</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-green-300 uppercase tracking-wider">{sam.greeting}</p>
            <div className="bg-white/10 backdrop-blur rounded-2xl rounded-tl-sm p-4">
              {sam.body.split('\n\n').map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed text-white/90 ${i > 0 ? 'mt-3' : ''}`}>{para}</p>
              ))}
            </div>
          </div>

          {sam.tip && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-green-200 leading-relaxed">💡 {sam.tip}</p>
            </div>
          )}

          {form.company_name && step !== 'empresa' && (
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs font-semibold text-white">{form.company_name}</p>
              {form.industry && <p className="text-xs text-green-200 mt-0.5">{form.industry}</p>}
            </div>
          )}

          <div className="flex gap-1.5 mt-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`h-1 flex-1 rounded-full transition-all
                ${i < stepIndex ? 'bg-green-300' : s.id === step ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
