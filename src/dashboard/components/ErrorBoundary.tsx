'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,0,85,0.1)' }}
          >
            <AlertCircle className="w-6 h-6" style={{ color: '#FF0055' }} />
          </div>

          <div className="text-center">
            <p
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: 'var(--text-primary)' }}
            >
              Algo salió mal
            </p>
            <p
              className="text-[10px] mt-1 font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              {this.state.message || 'Error inesperado'}
            </p>
          </div>

          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-widest hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
