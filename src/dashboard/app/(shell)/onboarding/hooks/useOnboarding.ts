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
  amazon_seller_id: string
  amazon_marketplace_id: string
  amazon_access_key: string
  amazon_secret_key: string
  shopify_store_url: string
  shopify_access_token: string
}

export interface MessagingData {
  wa_phone_number_id: string
  wa_business_account_id: string
  wa_access_token: string
  ig_account_id: string
  ig_access_token: string
  fb_page_id: string
  fb_page_access_token: string
}

export interface BillingData {
  facturama_username: string
  facturama_password: string
  facturama_sandbox: boolean
  facturapi_secret_key: string
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
  const [formData, setFormData] = useState<OnboardingFormData>({
    company: {},
    ecommerce: { facturama_sandbox: true } as Partial<EcommerceData>,
    messaging: {},
    billing: { facturama_sandbox: true },
    users: [],
  })

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))
  const goToStep = (step: number) => setCurrentStep(step)

  function updateCompany(data: Partial<CompanyData>) {
    setFormData(prev => ({ ...prev, company: { ...prev.company, ...data } }))
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

  async function submitOnboarding(): Promise<boolean> {
    setSubmitting(true)
    try {
      const payload = {
        company: formData.company,
        ecommerce: formData.ecommerce,
        messaging: formData.messaging,
        billing: formData.billing,
        users: formData.users,
      }
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return res.ok
    } catch {
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    currentStep,
    formData,
    submitting,
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
