'use client'

import { useRouter } from 'next/navigation'
import { useOnboarding } from './hooks/useOnboarding'
import { WizardProgress } from './components/WizardProgress'
import { Step1CompanyInfo } from './components/Step1CompanyInfo'
import { Step2Ecommerce } from './components/Step2Ecommerce'
import { Step3Messaging } from './components/Step3Messaging'
import { Step4Billing } from './components/Step4Billing'
import { Step5Users } from './components/Step5Users'

export default function OnboardingPage() {
  const router = useRouter()
  const {
    currentStep,
    formData,
    submitting,
    nextStep,
    prevStep,
    updateCompany,
    updateEcommerce,
    updateMessaging,
    updateBilling,
    addUser,
    removeUser,
    submitOnboarding,
  } = useOnboarding()

  async function handleSubmit() {
    const ok = await submitOnboarding()
    if (ok) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#040f1b] flex items-start justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#CCFF00]/4 blur-[200px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/4 blur-[200px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">
              KINEXIS Setup
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Configuración Inicial
          </h1>
          <p className="text-sm text-white/30 mt-1">
            Conecta tus plataformas en 5 pasos · Se puede modificar después
          </p>
        </div>

        {/* Progress */}
        <WizardProgress currentStep={currentStep} totalSteps={5} />

        {/* Card */}
        <div className="bg-white/3 border border-white/8 rounded-3xl p-8 backdrop-blur-sm shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {currentStep === 1 && (
            <Step1CompanyInfo
              data={formData.company}
              onChange={updateCompany}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <Step2Ecommerce
              data={formData.ecommerce}
              onChange={updateEcommerce}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <Step3Messaging
              data={formData.messaging}
              onChange={updateMessaging}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <Step4Billing
              data={formData.billing}
              onChange={updateBilling}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
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

        {/* Footer note */}
        <p className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest">
          Tus credenciales se almacenan encriptadas · AES-256
        </p>
      </div>
    </div>
  )
}
