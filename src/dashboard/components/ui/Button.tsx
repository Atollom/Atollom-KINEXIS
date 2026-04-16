import { type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper for tailwind class merging (standard practice, though not explicitly in prompt)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva(
  "rounded-full px-8 py-3.5 font-medium transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        primary: "bg-[#CCFF00] text-[#040f1b] hover:bg-[#CCFF00]/90 hover:shadow-[0_0_24px_rgba(204,255,0,0.3)]",
        ghost: "bg-white/5 backdrop-blur-3xl text-white hover:bg-white/10",
        glass: "bg-white/5 backdrop-blur-3xl text-white/90 hover:bg-white/8"
      }
    },
    defaultVariants: {
      variant: "glass"
    }
  }
)

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
}
