'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Building2, ShoppingCart, MessageSquare, Receipt, Users, ClipboardList, CheckCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useOnboarding } from './hooks/useOnboarding'
import { WizardProgress } from './components/WizardProgress'
import { Step1CompanyInfo } from './components/Step1CompanyInfo'
import { Step2Ecommerce } from './components/Step2Ecommerce'
import { Step3Messaging } from './components/Step3Messaging'
import { Step4Billing } from './components/Step4Billing'
import { Step5Users } from './components/Step5Users'
import SamanthaIntro, { type ModuleId } from './components/SamanthaIntro'
import { InlinePlanSelector } from './components/InlinePlanSelector'

const SamanthaOnboarding = dynamic(
  () => import('@/components/SamanthaOnboarding'),
  { ssr: false }
)

type Phase = 'intro' | 'plans' | 'prep' | 'wizard' | 'success'

interface WizardStep {
  id: 'company' | 'ecommerce' | 'crm' | 'erp' | 'users'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

function buildWizardSteps(modules: ModuleId[]): WizardStep[] {
  const steps: WizardStep[] = [{ id: 'company', label: 'Empresa', icon: Building2 }]
  if (modules.includes('ecommerce')) steps.push({ id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart })
  if (modules.includes('crm')) steps.push({ id: 'crm', label: 'Mensajería', icon: MessageSquare })
  if (modules.includes('erp')) steps.push({ id: 'erp', label: 'Facturación', icon: Receipt })
  steps.push({ id: 'users', label: 'Equipo', icon: Users })
  return steps
}

const MODULES_KEY = 'kinexis_selected_modules'
const STRIPE_SESSION_KEY = 'kinexis_stripe_session'
const STRIPE_PLAN_KEY = 'kinexis_stripe_plan'

const PREP_ITEMS = [
  { icon: Building2, label: 'Datos de empresa', detail: 'Nombre, RFC, dirección fiscal' },
  { icon: ShoppingCart, label: 'Acceso e-commerce', detail: 'Cuenta MercadoLibre, Amazon o Shopify' },
  { icon: MessageSquare, label: 'Cuenta Meta Business', detail: 'Para WhatsApp, Instagram y Facebook' },
  { icon: Receipt, label: 'Datos fiscales', detail: 'Régimen fiscal y lugar de expedición' },
  { icon: Users, label: 'Emails del equipo', detail: 'Colaboradores que usarán KINEXIS' },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('intro')
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([])
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerName, setOwnerName] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setOwnerEmail(user.email ?? '')
        setOwnerName(user.user_metadata?.full_name ?? '')
      }
    })
  }, [])

  const {
    currentStep,
    formData,
    submitting,
    submitError,
    nextStep,
    prevStep,
    goToStep,
    updateCompany,
    updateEcommerce,
    updateMessaging,
    updateBilling,
    addUser,
    removeUser,
    submitOnboarding,
  } = useOnboarding()

  // Handle returns from Stripe checkout and OAuth providers
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const ml = searchParams.get('ml')
    const amazon = searchParams.get('amazon')

    const stored = sessionStorage.getItem(MODULES_KEY)
    const restoredModules: ModuleId[] = stored
      ? JSON.parse(stored)
      : ['ecommerce', 'crm', 'erp']

    if (checkout === 'success') {
      setSelectedModules(restoredModules)
      setPhase('prep')
      // Persist Stripe session so submit can link subscription to tenant
      const stripeSession = searchParams.get('stripe_session')
      const stripePlan = searchParams.get('plan')
      if (stripeSession) sessionStorage.setItem(STRIPE_SESSION_KEY, stripeSession)
      if (stripePlan) sessionStorage.setItem(STRIPE_PLAN_KEY, stripePlan)
      return
    }

    if (checkout === 'cancel') {
      setSelectedModules(restoredModules)
      setPhase('plans')
      return
    }

    if (ml === 'connected' || ml === 'error') {
      setSelectedModules(restoredModules)
      setPhase('wizard')
      goToStep(restoredModules.indexOf('ecommerce') + 2) // step after company
      if (ml === 'connected') {
        const nickname = searchParams.get('nickname') ?? undefined
        updateEcommerce({ ml_connected: true, ml_nickname: nickname })
      }
      return
    }

    if (amazon === 'connected') {
      setSelectedModules(restoredModules)
      setPhase('wizard')
      updateEcommerce({ amazon_connected: true })
      return
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSamanthaComplete(modules: ModuleId[]) {
    setSelectedModules(modules)
    sessionStorage.setItem(MODULES_KEY, JSON.stringify(modules))
    setPhase('plans')
  }

  function handleTrialSelect() {
    setPhase('prep')
  }

  async function handleSubmit() {
    const stripeSession = sessionStorage.getItem(STRIPE_SESSION_KEY) ?? undefined
    const stripePlan = sessionStorage.getItem(STRIPE_PLAN_KEY) ?? undefined
    const { ok } = await submitOnboarding({ stripeSession, stripePlan, ownerEmail, ownerName })
    if (ok) {
      sessionStorage.removeItem(STRIPE_SESSION_KEY)
      sessionStorage.removeItem(STRIPE_PLAN_KEY)
      setPhase('success')
      setTimeout(() => router.push('/dashboard'), 2800)
    }
  }

  // ── Success screen ──────────────────────────────────────────────
  if (phase === 'success') {
    const companyName = formData.company.name ?? 'tu empresa'
    return (
      <div className="min-h-screen bg-[#040f1b] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#CCFF00]/6 blur-[200px] -z-10 rounded-full pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/4 blur-[200px] -z-10 rounded-full pointer-events-none" />
        <div className="text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 rounded-full bg-[#CCFF00]/15 border-2 border-[#CCFF00]/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(204,255,0,0.3)] animate-pulse">
            <svg className="w-10 h-10 text-[#CCFF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">¡Listo, {companyName.split(' ')[0]}!</h1>
          <p className="text-white/40 text-base mb-8">KINEXIS está configurado y Samantha está lista.</p>
          <div className="flex items-center justify-center gap-2 text-[#CCFF00]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-white/20 text-xs mt-3 uppercase tracking-widest">Entrando a tu dashboard...</p>
        </div>
      </div>
    )
  }

  // ── Phase 1: Samantha intro + module selection ──────────────────
  if (phase === 'intro') {
    return <SamanthaIntro onComplete={handleSamanthaComplete} />
  }

  // ── Phase 2: Plan selection ─────────────────────────────────────
  if (phase === 'plans') {
    return (
      <InlinePlanSelector
        selectedModules={selectedModules}
        onTrialSelect={handleTrialSelect}
      />
    )
  }

  // ── Phase 3: Prep checklist ─────────────────────────────────────
  if (phase === 'prep') {
    return (
      <div className="min-h-screen bg-[#040f1b] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#CCFF00]/4 blur-[180px] -z-10 rounded-full pointer-events-none" />
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
              <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">KINEXIS Setup · Paso 3 de 3</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-[#CCFF00]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Antes de empezar</h1>
            <p className="text-sm text-white/40 mt-2">Ten a la mano estos datos — el proceso toma solo 3 minutos</p>
          </div>

          <div className="bg-white/3 border border-white/8 rounded-3xl p-5 space-y-3 mb-6">
            {PREP_ITEMS.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-center gap-4 py-2.5 px-3 bg-white/3 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[11px] text-white/35">{detail}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-[#CCFF00]/30 ml-auto shrink-0" />
              </div>
            ))}
          </div>

          <p className="text-[11px] text-white/30 text-center mb-5">
            No te preocupes si no tienes todo — puedes configurarlo después desde tu panel.
          </p>

          <button
            onClick={() => setPhase('wizard')}
            className="w-full bg-[#CCFF00] text-black font-bold text-sm uppercase tracking-widest py-3.5 rounded-full hover:bg-[#CCFF00]/90 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
          >
            Tengo todo, ¡empecemos! →
          </button>
          <button
            onClick={() => setPhase('wizard')}
            className="w-full mt-2 text-white/25 hover:text-white/50 text-xs font-bold uppercase tracking-widest py-2 transition-colors"
          >
            Continuar sin preparar
          </button>
        </div>
      </div>
    )
  }

  // ── Phase 4: Dynamic wizard ─────────────────────────────────────
  const steps = buildWizardSteps(selectedModules)
  const totalSteps = steps.length
  const currentStepDef = steps[currentStep - 1] ?? steps[0]

  return (
    <div className="min-h-screen bg-[#040f1b] flex items-start justify-center p-6 relative overflow-hidden">
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#CCFF00]/4 blur-[200px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/4 blur-[200px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">
              KINEXIS Setup · Paso 3 de 3
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Configuración Técnica</h1>
          <p className="text-sm text-white/30 mt-1">
            {totalSteps} pasos · Puedes modificar todo después
          </p>
        </div>

        {/* Dynamic Progress */}
        <WizardProgress currentStep={currentStep} steps={steps} />

        {/* Step Card */}
        <div className="bg-white/3 border border-white/8 rounded-3xl p-8 backdrop-blur-sm shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {currentStepDef.id === 'company' && (
            <Step1CompanyInfo data={formData.company} onChange={updateCompany} onNext={nextStep} />
          )}
          {currentStepDef.id === 'ecommerce' && (
            <Step2Ecommerce data={formData.ecommerce} onChange={updateEcommerce} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStepDef.id === 'crm' && (
            <Step3Messaging data={formData.messaging} onChange={updateMessaging} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStepDef.id === 'erp' && (
            <Step4Billing data={formData.billing} onChange={updateBilling} onNext={nextStep} onBack={prevStep} companyRfc={formData.company.rfc} />
          )}
          {currentStepDef.id === 'users' && (
            <Step5Users
              users={formData.users}
              ownerEmail={ownerEmail}
              ownerName={ownerName}
              onAddUser={addUser}
              onRemoveUser={removeUser}
              onSubmit={handleSubmit}
              submitting={submitting}
              onBack={prevStep}
            />
          )}
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <span className="material-symbols-outlined !text-[16px] text-red-400 mt-0.5 flex-shrink-0">error</span>
            <p className="text-xs text-red-400 font-medium leading-relaxed">{submitError}</p>
          </div>
        )}

        <p className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest">
          Tus datos se almacenan encriptados · AES-256
        </p>
      </div>

      {/* Samantha floating helper during wizard */}
      <SamanthaOnboarding />
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}
