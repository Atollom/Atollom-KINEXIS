'use client'

import { useState, useEffect } from 'react'

export interface SamanthaMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: { name: string; preview?: string }[]
  timestamp?: number
}

const STORAGE_KEY = 'kinexis_samantha_global_history'
const MAX_MESSAGES = 50

const WELCOME: SamanthaMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hola, soy Samantha — tu agente digital de KINEXIS. ¿En qué te puedo ayudar hoy?',
  timestamp: Date.now(),
}

export function useSamanthaMemory(userId: string | null) {
  const [messages, setMessages] = useState<SamanthaMessage[]>([WELCOME])
  const [hydrated, setHydrated] = useState(false)

  // Load from storage once userId is known
  useEffect(() => {
    if (!userId) return

    const key = `${STORAGE_KEY}_${userId}`
    let loaded: SamanthaMessage[] | null = null

    // Try sessionStorage first, fall back to localStorage backup
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(`${key}_backup`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SamanthaMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed
        }
      } catch {
        // corrupted — start fresh
      }
    }

    setMessages(loaded ?? [WELCOME])
    setHydrated(true)
  }, [userId])

  // Persist to storage on every change (after hydration)
  useEffect(() => {
    if (!userId || !hydrated || messages.length === 0) return

    const key = `${STORAGE_KEY}_${userId}`
    const trimmed = messages.slice(-MAX_MESSAGES)

    sessionStorage.setItem(key, JSON.stringify(trimmed))

    // Backup to localStorage every 5 messages so refresh survives
    if (trimmed.length % 5 === 0) {
      localStorage.setItem(`${key}_backup`, JSON.stringify(trimmed))
    }
  }, [messages, userId, hydrated])

  const addMessage = (message: SamanthaMessage) => {
    setMessages(prev => [...prev, { ...message, timestamp: message.timestamp ?? Date.now() }])
  }

  const clearHistory = () => {
    if (userId) {
      const key = `${STORAGE_KEY}_${userId}`
      sessionStorage.removeItem(key)
      localStorage.removeItem(`${key}_backup`)
    }
    setMessages([{ ...WELCOME, id: Date.now().toString(), timestamp: Date.now() }])
  }

  return { messages, addMessage, setMessages, clearHistory }
}
