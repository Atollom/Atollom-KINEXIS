'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { authenticatedFetch } from '@/lib/api-client'

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function SamanthaFixedPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy Samantha. KINEXIS Neural Agent. ¿En qué te puedo ayudar hoy?'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const sessionId = useRef(`session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    function applySession(session: { access_token: string; user: { id: string; user_metadata?: Record<string, unknown> } } | null) {
      setToken(session?.access_token ?? null)
      setUserId(session?.user?.id ?? null)
      setTenantId((session?.user?.user_metadata?.tenant_id as string | undefined) ?? null)
    }

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      applySession(session)
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await authenticatedFetch('/api/samantha/chat', {
        method: 'POST',
        body: JSON.stringify({
          query: userMessage.content,
          history: messages,
          session_id: sessionId.current,
          tenant_id: tenantId,
          supabase_user_id: userId,
        })
      })

      const data = await res.json()

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || (res.ok
          ? 'Sin respuesta del servidor.'
          : `Error ${res.status}: ${data.error || 'Intenta de nuevo.'}`)
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión con los servidores. Verifica que el backend esté activo.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'rgba(204,255,0,0.12)', border: '1px solid rgba(204,255,0,0.2)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3
              className="text-sm font-black tracking-wide"
              style={{ color: 'var(--text-primary)' }}
            >
              Samantha AI
            </h3>
            <p
              className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${token ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: token ? 'var(--accent-primary)' : 'var(--text-muted)' }}
              />
              {token ? 'En línea' : 'Sin sesión'}
            </p>
          </div>
        </div>
        <div
          className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(204,255,0,0.08)',
            color: 'var(--accent-primary)',
            border: '1px solid rgba(204,255,0,0.15)',
          }}
        >
          Neural v4
        </div>
      </div>

      {/* BODY */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div
                className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#000000',
                  fontWeight: 600,
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            ) : (
              <div
                className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              {[0, 200, 400].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--accent-primary)', animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div
        className="p-4 shrink-0"
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Escribe a Samantha..."
            disabled={!token}
            className="w-full text-sm rounded-xl pl-4 pr-10 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !token}
            className="absolute right-2 p-2 disabled:opacity-40 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p
          className="text-[9px] text-center font-semibold uppercase tracking-widest mt-2"
          style={{ color: 'var(--text-muted)' }}
        >
          KINEXIS Neural Network v4.2
        </p>
      </div>
    </div>
  )
}
