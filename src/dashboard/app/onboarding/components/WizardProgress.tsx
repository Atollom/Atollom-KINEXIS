'use client'

import { Check } from 'lucide-react'

interface WizardStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface WizardProgressProps {
  currentStep: number
  steps: WizardStep[]
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const done = currentStep > stepNumber
        const active = currentStep === stepNumber
        const { icon: Icon } = step

        return (
          <div key={step.id} className="flex items-center shrink-0">
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
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`h-px w-10 mx-2 mb-5 transition-all duration-500 ${
                  currentStep > stepNumber ? 'bg-[#CCFF00]/60' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
