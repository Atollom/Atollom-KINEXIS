'use client'

import { useState } from 'react'

export interface CompanyData {
  name: string
  rfc: string
  address: string
  phone: string
  logo?: File | null
}

export interface EcommerceData {
  ml_connected: boolean
  ml_user_id?: string
  ml_nickname?: string
  amazon_connected: boolean
  shopify_connected: boolean
  shopify_store_url?: string
}

export interface MessagingData {
  meta_connected: boolean
}

export interface BillingData {
  rfc_emisor: string
  regimen_fiscal: string
  lugar_expedicion: string
}

export interface UserEntry {
  id: string
  full_name: string
  email: string
  role: 'owner' | 'admin' | 'agente' | 'almacenista' | 'contador'
}

export interface OnboardingFormData {
  company: Partial<CompanyData>
  ecommerce: Partial<EcommerceData>
  messaging: Partial<MessagingData>
  billing: Partial<BillingData>
  users: UserEntry[]
}

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<OnboardingFormData>({
    company: {},
    ecommerce: { ml_connected: false, amazon_connected: false, shopify_connected: false },
    messaging: { meta_connected: false },
    billing: {},
    users: [],
  })

  const nextStep = () => setCurrentStep(prev => prev + 1)
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))
  const goToStep = (step: number) => setCurrentStep(step)

  function updateCompany(data: Partial<CompanyData>) {
    setFormData(prev => {
      const updated = { ...prev, company: { ...prev.company, ...data } }
      // Auto-populate billing RFC when company RFC is set and billing RFC is not
      if (data.rfc && !prev.billing.rfc_emisor) {
        updated.billing = { ...prev.billing, rfc_emisor: data.rfc }
      }
      return updated
    })
  }

  function updateEcommerce(data: Partial<EcommerceData>) {
    setFormData(prev => ({ ...prev, ecommerce: { ...prev.ecommerce, ...data } }))
  }

  function updateMessaging(data: Partial<MessagingData>) {
    setFormData(prev => ({ ...prev, messaging: { ...prev.messaging, ...data } }))
  }

  function updateBilling(data: Partial<BillingData>) {
    setFormData(prev => ({ ...prev, billing: { ...prev.billing, ...data } }))
  }

  function addUser(user: Omit<UserEntry, 'id'>) {
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: crypto.randomUUID() }],
    }))
  }

  function removeUser(id: string) {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
    }))
  }

  async function submitOnboarding(
    opts: { stripeSession?: string; stripePlan?: string } = {}
  ): Promise<{ ok: boolean; error?: string }> {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        company: formData.company,
        ecommerce: formData.ecommerce,
        messaging: formData.messaging,
        billing: {
          ...formData.billing,
          rfc_emisor: formData.billing.rfc_emisor ?? formData.company.rfc ?? '',
          rfc: formData.billing.rfc_emisor ?? formData.company.rfc ?? '',
        },
        users: formData.users,
        ...(opts.stripeSession ? { stripe_session_id: opts.stripeSession } : {}),
        ...(opts.stripePlan ? { stripe_plan: opts.stripePlan } : {}),
      }
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) return { ok: true }
      const msg: string = data.error ?? `Error ${res.status}`
      setSubmitError(msg)
      return { ok: false, error: msg }
    } catch (e) {
      const msg = 'Error de conexión. Verifica tu internet e intenta de nuevo.'
      setSubmitError(msg)
      return { ok: false, error: msg }
    } finally {
      setSubmitting(false)
    }
  }

  return {
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
  }
}
