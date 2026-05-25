'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Building2, ShoppingCart, MessageSquare, Receipt, Users } from 'lucide-react'
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

type Phase = 'intro' | 'plans' | 'wizard'

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

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<Phase>('intro')
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([])

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
      setPhase('wizard')
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
    setPhase('wizard')
  }

  async function handleSubmit() {
    const { ok } = await submitOnboarding()
    if (ok) router.push('/dashboard')
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

  // ── Phase 3: Dynamic wizard ─────────────────────────────────────
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
            <Step4Billing data={formData.billing} onChange={updateBilling} onNext={nextStep} onBack={prevStep} />
          )}
          {currentStepDef.id === 'users' && (
            <Step5Users
              users={formData.users}
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
