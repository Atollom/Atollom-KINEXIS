'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Obtener access_token al montar — refresca si expira
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function loadToken() {
      const { data: { session } } = await supabase.auth.getSession()
      setToken(session?.access_token ?? null)
    }

    loadToken()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null)
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/samantha/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: userMessage.content, history: messages })
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
    <div className="flex flex-col h-full bg-gray-900">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-green-500 to-cyan-500 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide">Samantha AI</h3>
            <p className="text-[10px] text-white/90 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${token ? 'bg-white animate-pulse' : 'bg-white/40'}`}></span>
              {token ? 'En línea' : 'Sin sesión'}
            </p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              m.role === 'user'
                ? 'bg-green-500 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Escribe a Samantha..."
            disabled={!token}
            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-green-500/50 focus:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !token}
            className="absolute right-2 p-2 text-gray-400 hover:text-green-500 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-center text-gray-500 font-semibold uppercase tracking-widest mt-2">
          KINEXIS Neural Network v4.2
        </p>
      </div>

    </div>
  )
}
