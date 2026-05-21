'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Minimize2, Sparkles } from 'lucide-react'
import { authenticatedFetch } from '@/lib/api-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function SamanthaOnboarding() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Bienvenido a KINEXIS! 👋\n\nSoy Samantha, tu asistente personal. Estoy aquí para ayudarte a configurar tu cuenta de la manera más fácil y rápida.\n\n¿Prefieres que te guíe paso a paso, o tienes alguna pregunta antes de empezar?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const sessionId = useRef(`onboarding_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await authenticatedFetch('/api/samantha/chat', {
        method: 'POST',
        body: JSON.stringify({
          query: text,
          history: messages,
          session_id: sessionId.current,
          context: { page: 'onboarding', role: 'concierge' },
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Disculpa, tuve un problema técnico. ¿Intentamos de nuevo?',
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[#CCFF00] text-black text-sm font-black shadow-[0_8px_32px_rgba(204,255,0,0.3)] hover:bg-[#d4ff33] transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Samantha
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[520px] flex flex-col rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] border border-white/10 bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#CCFF00]/10 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#CCFF00]/15 border border-[#CCFF00]/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#CCFF00]" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Samantha</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCFF00]/70">Concierge · Online</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 [&::-webkit-scrollbar]:hidden">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#CCFF00] text-black font-semibold rounded-tr-sm'
                : 'bg-white/6 border border-white/8 text-white/90 rounded-tl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/6 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/8 bg-white/3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#CCFF00]/40 transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#CCFF00] text-black hover:bg-[#d4ff33] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
