'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Paperclip, X } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { authenticatedFetch } from '@/lib/api-client'

interface Attachment {
  id: string
  name: string
  type: string
  data: string
  preview?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: { name: string; preview?: string }[]
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j}>{part.slice(2, -2)}</strong>
        : part
    )
    return <span key={i}>{rendered}{i < arr.length - 1 && <br />}</span>
  })
}

export function SamanthaFixedPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy Samantha — tu agente digital de KINEXIS. ¿En qué te puedo ayudar hoy?',
    },
  ])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const sessionId = useRef(`session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl.split(',')[1]
        setAttachments(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            data: base64,
            preview: file.type.startsWith('image/') ? dataUrl : undefined,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return

    const currentAttachments = [...attachments]
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: currentAttachments.map(a => ({ name: a.name, preview: a.preview })),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
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
          ...(currentAttachments.length > 0
            ? {
                attachments: currentAttachments.map(a => ({
                  name: a.name,
                  type: a.type,
                  data: a.data,
                })),
              }
            : {}),
        }),
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            data.response ||
            (res.ok
              ? 'Sin respuesta del servidor.'
              : `Error ${res.status}: ${data.error || 'Intenta de nuevo.'}`),
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Error de conexión con los servidores. Verifica que el backend esté activo.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* HEADER */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'rgba(204,255,0,0.12)', border: '1px solid rgba(204,255,0,0.2)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>
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
                style={{ backgroundColor: 'var(--accent-primary)', color: '#000000', fontWeight: 600 }}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.attachments.map((a, i) =>
                      a.preview ? (
                        <img
                          key={i}
                          src={a.preview}
                          alt={a.name}
                          className="max-h-28 max-w-full rounded-lg object-contain"
                        />
                      ) : (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-black/10"
                        >
                          📎 {a.name}
                        </span>
                      )
                    )}
                  </div>
                )}
                {m.content && (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                )}
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
                <p className="whitespace-pre-wrap leading-relaxed">{renderMarkdown(m.content)}</p>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
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
        className="shrink-0"
        style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
      >
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {attachments.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-1 pl-1.5 pr-1 py-1 rounded-lg text-[11px] font-medium"
                style={{
                  backgroundColor: 'rgba(204,255,0,0.1)',
                  border: '1px solid rgba(204,255,0,0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                {a.preview ? (
                  <img src={a.preview} alt={a.name} className="w-5 h-5 object-cover rounded" />
                ) : (
                  <Paperclip className="w-3 h-3 opacity-60" />
                )}
                <span className="max-w-[72px] truncate">{a.name}</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4">
          <div className="relative flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!token}
              title="Adjuntar imagen o PDF"
              className="p-2 rounded-lg shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'rgba(204,255,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Escribe a Samantha..."
              disabled={!token}
              className="flex-1 text-sm rounded-xl pl-4 pr-10 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none"
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
              disabled={(!input.trim() && attachments.length === 0) || isLoading || !token}
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
    </div>
  )
}
