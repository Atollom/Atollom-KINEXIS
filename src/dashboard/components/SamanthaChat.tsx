"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────────────

/** Mensaje de bienvenida que se muestra la primera vez que se abre el chat */
const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy Samantha, tu asistente personal de Kinexis.\n\n" +
    "Estoy aquí para ayudarte a sacar el máximo provecho de tu negocio. " +
    "Puedo generarte reportes, revisar órdenes, darte seguimiento a " +
    "prospectos y mucho más — cuando lo necesites.\n\n" +
    "¿Cómo te gusta que te llame?",
  ts: new Date().toISOString(),
};

/** Clave base para localStorage — se le concatena el tenant_id */
const STORAGE_KEY_PREFIX = "kinexis_samantha_history_";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de persistencia
// ──────────────────────────────────────────────────────────────────────────────

function getStorageKey(tenantId: string): string {
  return `${STORAGE_KEY_PREFIX}${tenantId}`;
}

function loadHistory(tenantId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Si el JSON está corrupto, limpiar
    localStorage.removeItem(getStorageKey(tenantId));
  }
  return [];
}

function saveHistory(tenantId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    // Limitar a últimos 100 mensajes para no saturar localStorage
    const trimmed = messages.slice(-100);
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(trimmed));
  } catch {
    // localStorage lleno — silenciar
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente: Burbuja de mensaje
// ──────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {/* Avatar de Samantha (solo en mensajes del asistente) */}
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-primary-container/20 flex items-center justify-center mt-0.5">
          <Image
            src="/ATOLLOM_AI_ICON.png"
            alt="Samantha"
            width={16}
            height={16}
            className="object-contain"
          />
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed
          ${isUser
            ? "bg-primary-container text-on-primary-container rounded-br-sm font-medium"
            : "bg-surface-container text-on-surface rounded-bl-sm"
          }
          ${isStreaming ? "animate-pulse" : ""}
        `}
      >
        {/* Renderizar saltos de línea */}
        {message.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente: Indicador de escritura
// ──────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary-container/20 to-primary-container/5 border border-primary-container/20 flex items-center justify-center">
        <Image
          src="/ATOLLOM_AI_ICON.png"
          alt="Samantha"
          width={16}
          height={16}
          className="object-contain"
        />
      </div>
      <div className="bg-surface-container rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal: SamanthaChat (Fixed Sidebar)
// ──────────────────────────────────────────────────────────────────────────────
interface SamanthaChatProps {
  /** ID del tenant para persistir historial por organización */
  tenantId?: string;
  /** Subscription plan ID */
  planId?: string;
}

export function SamanthaChat({ tenantId = "default", planId = "enterprise" }: SamanthaChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Inactivity Timer (2 mins) ────────────────────────────────
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, []);

  useEffect(() => {
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);

    // Si el chat está abierto o ya se mostró la intervención, no re-activar el timer
    if (expanded || showIntervention) return;

    activityTimerRef.current = setTimeout(() => {
      setShowIntervention(true);
    }, 120000); // 2 minutos

    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [lastActivity, expanded, showIntervention]);

  // ── Analyze My Context (Helper) ──────────────────────────────
  const handleAnalyzeContext = useCallback(async (pastedText: string) => {
    setExpanded(true);
    setShowIntervention(false);
    const contextMsg = "Analizando contexto copiado...\n\n" + (pastedText.length > 500 ? pastedText.substring(0, 500) + "..." : pastedText);
    
    const userMsg: ChatMessage = {
      role: "user",
      content: contextMsg,
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const query = `[PROTOCOL: NO ESTÁS SOLO] El usuario ha pegado este contexto de error o pantalla: "${pastedText.substring(0, 1000)}". Analízalo detalladamente, identifica si hay una suspensión o error conocido, y propón una solución inmediata con un tono premium y tranquilizador.`;

    await sendToSamantha(query);
  }, [planId]);

  // ── Send to API (Internal) ───────────────────────────────────
  const sendToSamantha = async (text: string) => {
    setStreaming(true);
    setStreamingText("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          context: "full",
          history: messages.filter(m => m.role !== 'system').slice(-20)
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`Error (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setStreamingText(accumulated);
          } catch {}
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content: accumulated, ts: new Date().toISOString() }]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión.", ts: new Date().toISOString() }]);
    } finally {
      setStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  // ── Cargar historial al montar ────────────────────────────────
  useEffect(() => {
    const saved = loadHistory(tenantId);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // Primera vez: inyectar mensaje de bienvenida
      setMessages([WELCOME_MESSAGE]);
    }
    setInitialized(true);
  }, [tenantId]);

  // ── Persistir historial cuando cambian los mensajes ───────────
  useEffect(() => {
    if (initialized && messages.length > 0) {
      saveHistory(tenantId, messages);
    }
  }, [messages, tenantId, initialized]);

  // ── Auto-scroll al fondo ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, expanded]);

  // ── Focus al input cuando se abre ─────────────────────────────
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  // ── Enviar mensaje vía streaming ──────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      ts: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    await sendToSamantha(text);
  }, [inputValue, streaming, planId]);

  // ── Limpiar historial ─────────────────────────────────────────
  const handleClear = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    saveHistory(tenantId, [WELCOME_MESSAGE]);
  }, [tenantId]);

  // ── Enviar con Enter ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t border-outline-variant">
      {/* Header Toggle */}
      <button 
        onClick={() => setExpanded(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container/50 transition-all group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center">
            <Image
              src="/ATOLLOM_AI_ICON.png"
              alt="Samantha"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
        </div>
        
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-on-surface">Samantha</p>
          <p className="text-[10px] text-on-surface-variant">Asistente Kinexis AI</p>
        </div>

        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
          {expanded ? "expand_more" : "chevron_right"}
        </span>
      </button>

      {/* Expanded Chat Panel */}
      {expanded && (
        <div className="flex flex-col h-[280px] border-t border-outline-variant">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <MessageBubble key={`${msg.ts}-${i}`} message={msg} />
            ))}

            {streaming && streamingText && (
              <MessageBubble
                message={{
                  role: "assistant",
                  content: streamingText,
                  ts: new Date().toISOString(),
                }}
                isStreaming
              />
            )}

            {streaming && !streamingText && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-outline-variant">
            <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={streaming}
                placeholder="Pregunta algo..."
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={streaming || !inputValue.trim()}
                className={`p-1 rounded transition-all ${inputValue.trim() && !streaming ? "text-primary hover:bg-primary/10" : "text-on-surface-variant/30 cursor-not-allowed"}`}
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intervention Banner */}
      {showIntervention && !expanded && (
        <div className="px-3 py-2 border-t border-outline-variant bg-primary/5">
          <button 
            onClick={() => {
              setExpanded(true);
              setShowIntervention(false);
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-surface-container transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-primary text-base">smart_toy</span>
            <div>
              <p className="text-sm font-medium text-on-surface">¿Necesitas ayuda?</p>
              <p className="text-[10px] text-on-surface-variant">Toca para hablar con Samantha</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}