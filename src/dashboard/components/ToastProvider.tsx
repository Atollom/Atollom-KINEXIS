'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToastInput {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  duration?: number
}

interface Toast extends ToastInput {
  id: string
  visible: boolean
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ── Config ────────────────────────────────────────────────────────────────────

const TOAST_CONFIG = {
  success: {
    Icon: CheckCircle2,
    borderColor: 'rgba(204,255,0,0.4)',
    iconColor: '#CCFF00',
    labelColor: '#CCFF00',
  },
  warning: {
    Icon: AlertTriangle,
    borderColor: 'rgba(251,191,36,0.4)',
    iconColor: '#FBB924',
    labelColor: '#FBB924',
  },
  error: {
    Icon: XCircle,
    borderColor: 'rgba(255,0,85,0.4)',
    iconColor: '#FF0055',
    labelColor: '#FF0055',
  },
  info: {
    Icon: Info,
    borderColor: 'rgba(96,165,250,0.4)',
    iconColor: '#60A5FA',
    labelColor: '#60A5FA',
  },
} as const

// ── ToastItem ─────────────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const cfg = TOAST_CONFIG[toast.type]
  const Icon = cfg.Icon

  return (
    <div
      role="alert"
      style={{
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateX(0)' : 'translateX(16px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        background: 'rgba(4,15,27,0.96)',
        border: `1px solid ${cfg.borderColor}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '360px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ marginTop: '1px', flexShrink: 0 }}>
        <Icon size={16} color={cfg.iconColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: cfg.labelColor,
          marginBottom: '2px',
        }}>
          {toast.title}
        </p>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.4,
          fontWeight: 500,
        }}>
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          flexShrink: 0,
          marginTop: '1px',
          padding: '2px',
          color: 'rgba(255,255,255,0.2)',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── ToastProvider ─────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    // Trigger exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
    // Remove from DOM after animation
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250)
    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)
    timers.current.delete(id)
  }, [])

  const showToast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).slice(2, 11)
    setToasts(prev => [...prev, { ...input, id, visible: false }])

    // Enter animation — needs one paint cycle to transition from invisible
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: true } : t))
      )
    )

    const duration = input.duration ?? 5000
    const timer = setTimeout(() => removeToast(id), duration)
    timers.current.set(id, timer)
  }, [removeToast])

  // Cleanup on unmount
  useEffect(() => {
    const map = timers.current
    return () => map.forEach(t => clearTimeout(t))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: '72px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
