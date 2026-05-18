'use client'

import { Building2, ShoppingCart, MessageSquare, Receipt, Users, Check } from 'lucide-react'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

const STEPS = [
  { number: 1, name: 'Empresa', Icon: Building2 },
  { number: 2, name: 'E-commerce', Icon: ShoppingCart },
  { number: 3, name: 'Mensajería', Icon: MessageSquare },
  { number: 4, name: 'Facturación', Icon: Receipt },
  { number: 5, name: 'Usuarios', Icon: Users },
]

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, index) => {
        const done = currentStep > step.number
        const active = currentStep === step.number
        const { Icon } = step

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${done
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]'
                    : active
                    ? 'bg-[#CCFF00]/20 text-[#CCFF00] border-2 border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                    : 'bg-white/5 text-white/30 border border-white/10'
                  }
                `}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`mt-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${
                  active ? 'text-[#CCFF00]' : done ? 'text-white/60' : 'text-white/20'
                }`}
              >
                {step.name}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-12 mx-3 mb-5 transition-all duration-500 ${
                  currentStep > step.number ? 'bg-[#CCFF00]/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
