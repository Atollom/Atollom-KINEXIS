import React from 'react'
import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated'
}

export function Card({ className, variant = 'default', style, children, ...props }: CardProps) {
  const variantStyles: React.CSSProperties =
    variant === 'elevated'
      ? { backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }
      : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(var(--blur-md))' }

  return (
    <div
      className={clsx('rounded-2xl transition-all duration-300', className)}
      style={{ ...variantStyles, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, style, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('px-6 pt-6 pb-4', className)}
      style={{ borderBottom: '1px solid var(--border-color)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, style, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx('text-base font-semibold tracking-tight', className)}
      style={{ color: 'var(--text-primary)', ...style }}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, style, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('px-6 pb-6 pt-4', className)}
      style={{ borderTop: '1px solid var(--border-color)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
