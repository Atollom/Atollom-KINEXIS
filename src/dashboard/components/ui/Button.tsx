import React, { type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper for tailwind class merging (standard practice, though not explicitly in prompt)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva(
  "rounded-full px-8 py-3.5 font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
  {
    variants: {
      variant: {
        primary: "text-black hover:opacity-90 hover:shadow-[0_0_24px_rgba(204,255,0,0.3)]",
        secondary: "border hover:opacity-80",
        ghost: "hover:opacity-80",
        glass: "backdrop-blur-3xl hover:opacity-80",
        destructive: "hover:opacity-90",
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

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--accent-primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--shadow-glow)' },
  secondary: { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' },
  ghost: { color: 'var(--text-secondary)' },
  glass: { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', backdropFilter: 'blur(12px)' },
  destructive: { backgroundColor: 'var(--accent-danger)', color: '#ffffff' },
}

export function Button({ className, variant = 'glass', style, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, className }))}
      style={{ ...variantStyles[variant ?? 'glass'], ...style }}
      {...props}
    />
  )
}
