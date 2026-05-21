'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, ArrowRight, SkipForward } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content:
    '¡Hola! Soy Samantha, tu asistente de inteligencia artificial en KINEXIS. 🙌\n\nEstoy aquí para ayudarte a configurar tu cuenta de la manera más fácil y personalizada posible.\n\nPara empezar — ¿cuál es el nombre de tu empresa?',
}

interface Props {
  onComplete: () => void
}

export default function SamanthaIntro({ onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const [exchanges, setExchanges] = useState(0)
  const sessionId = useRef(`intro_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Show the "continue" CTA after 2 user exchanges
  useEffect(() => {
    if (exchanges >= 2) {
      setTimeout(() => setShowCTA(true), 800)
    }
  }, [exchanges])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/samantha/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          query: text,
          history: messages,
          session_id: sessionId.current,
          context: { page: 'onboarding', role: 'concierge' },
        }),
      })

      const data = await res.json()
      const reply = data.response || '¿Puedes repetir eso? Quiero entenderte bien.'

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      }])
      setExchanges(e => e + 1)
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un pequeño problema de conexión. ¿Intentamos de nuevo?',
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="min-h-screen bg-[#040f1b] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#CCFF00]/4 blur-[180px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/3 blur-[180px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 2rem)', maxHeight: '780px' }}>
        {/* Header */}
        <div className="text-center mb-6 pt-4 shrink-0">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">KINEXIS Setup</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Bienvenido a KINEXIS</h1>
          <p className="text-xs text-white/30 mt-1">Samantha te guía en la configuración inicial</p>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col bg-white/3 border border-white/8 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] min-h-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#CCFF00]/8 border-b border-white/6 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#CCFF00]/15 border border-[#CCFF00]/25 flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <Sparkles className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Samantha</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCFF00]/70">
                  Concierge · Online
                </p>
              </div>
            </div>
            <button
              onClick={onComplete}
              className="ml-auto flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Saltar intro
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 [&::-webkit-scrollbar]:hidden">
            {messages.map((m, i) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${i > 0 ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-[#CCFF00]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#CCFF00] text-black font-semibold rounded-tr-sm'
                    : 'bg-white/6 border border-white/8 text-white/90 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-[#CCFF00]" />
                </div>
                <div className="bg-white/6 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]/60 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTA after 2 exchanges */}
            {showCTA && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="w-6 h-6 mr-2 mt-1 shrink-0" />
                <button
                  onClick={onComplete}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#CCFF00] text-black text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-[#d4ff1a] transition-all"
                >
                  Comenzar configuración
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-white/6 bg-white/2 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Escribe tu respuesta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#CCFF00]/40 transition-colors"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-[#CCFF00] text-black hover:bg-[#d4ff33] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-[0_0_12px_rgba(204,255,0,0.2)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-white/15 mt-4 uppercase tracking-widest shrink-0">
          Conversación privada · No se comparte con terceros
        </p>
      </div>
    </div>
  )
}
