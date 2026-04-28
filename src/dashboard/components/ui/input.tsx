import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, style, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200',
          'placeholder:opacity-40',
          error ? 'ring-1' : '',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--border-color)'}`,
          color: 'var(--text-primary)',
          outline: 'none',
          ...(error ? { boxShadow: '0 0 0 1px var(--accent-danger)' } : {}),
          ...style,
        }}
        {...props}
      />
      {error && (
        <span className="text-xs" style={{ color: 'var(--accent-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

export function Textarea({ label, error, className, style, id, ...props }: InputProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 rounded-lg text-sm transition-colors duration-200 resize-none',
          'placeholder:opacity-40',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--accent-danger)' : 'var(--border-color)'}`,
          color: 'var(--text-primary)',
          outline: 'none',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span className="text-xs" style={{ color: 'var(--accent-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
