'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, ArrowRight, SkipForward, ShoppingCart, MessageSquare, Receipt, Check } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export type ModuleId = 'ecommerce' | 'crm' | 'erp'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MODULES: { id: ModuleId; label: string; subtitle: string; tags: string[]; icon: React.ReactNode; color: string; border: string; activeBg: string }[] = [
  {
    id: 'ecommerce',
    label: 'E-commerce',
    subtitle: 'Gestiona tus canales de venta',
    tags: ['MercadoLibre', 'Amazon', 'Shopify'],
    icon: <ShoppingCart className="w-5 h-5" />,
    color: 'text-yellow-400',
    border: 'border-yellow-400/30',
    activeBg: 'bg-yellow-400/10',
  },
  {
    id: 'crm',
    label: 'CRM & Mensajería',
    subtitle: 'Centraliza la comunicación con clientes',
    tags: ['WhatsApp', 'Instagram', 'Facebook'],
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    activeBg: 'bg-blue-400/10',
  },
  {
    id: 'erp',
    label: 'ERP & Facturación',
    subtitle: 'Administra tu operación interna',
    tags: ['CFDI 4.0', 'Inventario', 'Finanzas'],
    icon: <Receipt className="w-5 h-5" />,
    color: 'text-[#CCFF00]',
    border: 'border-[#CCFF00]/30',
    activeBg: 'bg-[#CCFF00]/8',
  },
]

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content:
    '¡Hola! Soy Samantha, tu asistente de inteligencia artificial en KINEXIS. 🙌\n\nEstoy aquí para ayudarte a configurar tu cuenta de la manera más fácil y personalizada posible.\n\nPara empezar — ¿cuál es el nombre de tu empresa y a qué se dedican?',
}

interface Props {
  onComplete: (modules: ModuleId[]) => void
}

export default function SamanthaIntro({ onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanges, setExchanges] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([])
  const [pickerConfirmed, setPickerConfirmed] = useState(false)
  const sessionId = useRef(`intro_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showPicker])

  useEffect(() => {
    if (exchanges >= 2 && !showPicker) {
      setTimeout(() => setShowPicker(true), 600)
    }
  }, [exchanges, showPicker])

  function toggleModule(id: ModuleId) {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function confirmModules() {
    const mods = selectedModules.length > 0 ? selectedModules : (['ecommerce', 'crm', 'erp'] as ModuleId[])
    setPickerConfirmed(true)

    const names = mods.map(m => MODULES.find(x => x.id === m)!.label).join(', ')
    setMessages(prev => [...prev, {
      id: `confirm_${Date.now()}`,
      role: 'assistant',
      content: `Perfecto. Voy a configurar KINEXIS con: **${names}**.\n\nAhora pasamos a la configuración técnica — será rápido, te lo prometo.`,
    }])

    setTimeout(() => onComplete(mods), 1200)
  }

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
      <div className="fixed top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#CCFF00]/4 blur-[180px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/3 blur-[180px] -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 2rem)', maxHeight: '820px' }}>
        {/* Header */}
        <div className="text-center mb-5 pt-4 shrink-0">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse" />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-[0.4em]">KINEXIS Setup</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Bienvenido a KINEXIS</h1>
          <p className="text-xs text-white/30 mt-1">Samantha personaliza tu configuración</p>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col bg-white/3 border border-white/8 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] min-h-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#CCFF00]/8 border-b border-white/6 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-[#CCFF00]/15 border border-[#CCFF00]/25 flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <Sparkles className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Samantha</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCFF00]/70">Concierge · Online</p>
              </div>
            </div>
            <button
              onClick={() => onComplete(['ecommerce', 'crm', 'erp'])}
              className="ml-auto flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/50 uppercase tracking-widest font-bold transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Saltar
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
                <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Module picker — appears after 2 exchanges */}
            {showPicker && !pickerConfirmed && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Samantha picker message */}
                <div className="flex justify-start mb-3">
                  <div className="w-6 h-6 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-[#CCFF00]" />
                  </div>
                  <div className="bg-white/6 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-white/90 leading-relaxed max-w-[82%]">
                    ¿Qué módulos de KINEXIS necesitas? Puedes activar uno, dos o los tres — lo que más se adapte a tu negocio:
                  </div>
                </div>

                {/* Module cards */}
                <div className="ml-8 space-y-2.5">
                  {MODULES.map(mod => {
                    const selected = selectedModules.includes(mod.id)
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                          selected
                            ? `${mod.activeBg} ${mod.border} shadow-[0_0_20px_rgba(204,255,0,0.08)]`
                            : 'bg-white/3 border-white/8 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 shrink-0 transition-colors ${selected ? mod.color : 'text-white/30'}`}>
                            {mod.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-bold transition-colors ${selected ? 'text-white' : 'text-white/60'}`}>
                                {mod.label}
                              </p>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                selected ? `${mod.color} border-current bg-current/20` : 'border-white/20'
                              }`}>
                                {selected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                            </div>
                            <p className={`text-xs mt-0.5 transition-colors ${selected ? 'text-white/60' : 'text-white/30'}`}>
                              {mod.subtitle}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {mod.tags.map(tag => (
                                <span
                                  key={tag}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                                    selected
                                      ? `${mod.color} bg-current/10 border border-current/20`
                                      : 'text-white/25 bg-white/4 border border-white/8'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  <button
                    onClick={confirmModules}
                    disabled={selectedModules.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-1 rounded-2xl bg-[#CCFF00] text-black text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.25)] hover:bg-[#d4ff1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    Comenzar mi configuración
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input — hidden after picker confirmed */}
          {!pickerConfirmed && (
            <div className="px-4 py-4 border-t border-white/6 bg-white/2 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder={showPicker ? 'Selecciona los módulos arriba o escribe algo más...' : 'Escribe tu respuesta...'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CCFF00]/40 transition-colors"
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
          )}
        </div>

        <p className="text-center text-[9px] text-white/15 mt-3 uppercase tracking-widest shrink-0">
          Conversación privada · No se comparte con terceros
        </p>
      </div>
    </div>
  )
}
