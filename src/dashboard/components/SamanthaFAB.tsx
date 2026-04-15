"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
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
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#A8E63D]/20 to-[#A8E63D]/5 border border-[#A8E63D]/20 flex items-center justify-center mt-0.5">
          <Image
            src="/ATOLLOM_AI_ICON.png"
            alt="Samantha"
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
      )}

      <div
        className={`
          max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed
          ${isUser
            ? "bg-[#A8E63D] text-[#0D1B3E] rounded-br-md font-medium"
            : "bg-white/[0.06] text-[#E8EAF0] rounded-bl-md"
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
      <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#A8E63D]/20 to-[#A8E63D]/5 border border-[#A8E63D]/20 flex items-center justify-center">
        <Image
          src="/ATOLLOM_AI_ICON.png"
          alt="Samantha"
          width={20}
          height={20}
          className="object-contain"
        />
      </div>
      <div className="bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#A8E63D]/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal: SamanthaFAB
// ──────────────────────────────────────────────────────────────────────────────
interface SamanthaFABProps {
  /** ID del tenant para persistir historial por organización */
  tenantId?: string;
  /** Subscription plan ID */
  planId?: string;
}

export function SamanthaFAB({ tenantId = "default", planId = "enterprise" }: SamanthaFABProps) {
  const [open, setOpen] = useState(false);
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
      // No ocultamos la intervención si ya se mostró, dejamos que el usuario interactúe con ella
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
    if (open || showIntervention) return;

    activityTimerRef.current = setTimeout(() => {
      setShowIntervention(true);
    }, 120000); // 2 minutos

    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [lastActivity, open, showIntervention]);

  // ── Analyze My Context (Helper) ──────────────────────────────
  const handleAnalyzeContext = useCallback(async (pastedText: string) => {
    setOpen(true);
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
        body: JSON.stringify({ message: text, context: "full", plan_id: planId }),
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
  }, [messages, streamingText, open]);

  // ── Focus al input cuando se abre ─────────────────────────────
  useEffect(() => {
    if (open) {
      // Pequeño delay para esperar la animación
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  // ── Cerrar modal y cancelar streaming ─────────────────────────
  const handleClose = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setOpen(false);
  }, []);

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
    <>
      {/* ═══════════════════════════════════════════════════════════
          MODAL DE CHAT
          ═══════════════════════════════════════════════════════════ */}
      {open && (
        <div
          className="
            fixed z-[60]

            /* Móvil: fullscreen */
            inset-0

            /* Desktop: modal flotante bottom-right */
            md:inset-auto
            md:bottom-24 md:right-6
            md:w-[380px] md:h-[520px]
            md:rounded-2xl

            bg-background/98 md:bg-surface/97
            backdrop-blur-2xl
            md:border md:border-outline-variant
            md:shadow-2xl md:shadow-black/50

            flex flex-col
            overflow-hidden
            animate-in
          "
          role="dialog"
          aria-label="Chat con Samantha"
          aria-modal="true"
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 md:px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            {/* Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#A8E63D]/20 to-[#A8E63D]/5 border border-[#A8E63D]/25 flex items-center justify-center">
                <Image
                  src="/ATOLLOM_AI_ICON.png"
                  alt="Samantha"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              {/* Indicador online */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#A8E63D] border-2 border-[#0A1628]" />
            </div>

            {/* Nombre y subtítulo */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-headline font-bold text-[#E8EAF0]">
                Samantha
              </p>
              <p className="text-[11px] text-[#8DA4C4]">
                Tu asistente Kinexis
              </p>
            </div>

            {/* Acciones del header */}
            <div className="flex items-center gap-1">
              {/* Limpiar historial */}
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.06] transition-all duration-150"
                aria-label="Limpiar conversación"
                title="Limpiar conversación"
              >
                <span className="material-symbols-outlined text-base">
                  delete_sweep
                </span>
              </button>

              {/* Cerrar */}
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#8DA4C4] hover:text-[#E8EAF0] hover:bg-white/[0.06] transition-all duration-150"
                aria-label="Cerrar chat"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>
          </div>

          {/* ── Historial de mensajes ────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-4 py-4 space-y-3"
            role="log"
            aria-live="polite"
            aria-label="Historial de conversación"
          >
            {messages.map((msg, i) => (
              <MessageBubble key={`${msg.ts}-${i}`} message={msg} />
            ))}

            {/* Burbuja de streaming en progreso */}
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

            {/* Indicador de escritura (antes de que llegue texto) */}
            {streaming && !streamingText && <TypingIndicator />}

            {/* Ancla para auto-scroll */}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ────────────────────────────────────────────── */}
          <div className="flex-shrink-0 px-3 md:px-4 py-3 border-t border-white/[0.06]">
            <div
              className={`
                flex items-center gap-2
                bg-white/[0.04] rounded-xl
                px-4 py-2.5
                border transition-colors duration-200
                ${inputRef.current === document.activeElement
                  ? "border-[#A8E63D]/30"
                  : "border-transparent"
                }
              `}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={streaming}
                placeholder="Escribe un mensaje..."
                className="
                  flex-1 bg-transparent text-sm text-[#E8EAF0]
                  placeholder:text-[#506584]
                  outline-none
                  disabled:opacity-50
                "
                aria-label="Mensaje para Samantha"
              />

              {/* Botón enviar */}
              <button
                onClick={handleSend}
                disabled={streaming || !inputValue.trim()}
                className={`
                  p-1.5 rounded-lg transition-all duration-200
                  ${inputValue.trim() && !streaming
                    ? "text-[#A8E63D] hover:bg-[#A8E63D]/10 hover:scale-105 active:scale-95"
                    : "text-[#506584] cursor-not-allowed"
                  }
                `}
                aria-label="Enviar mensaje"
              >
                <span className="material-symbols-outlined text-lg">
                  send
                </span>
              </button>
            </div>

            {/* Disclaimer sutil */}
            <p className="text-[9px] text-[#506584] text-center mt-2 select-none">
              Samantha puede cometer errores · Verifica la información importante
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          INTERVENCIÓN (Burbuja de inactividad)
          ═══════════════════════════════════════════════════════════ */}
      {showIntervention && !open && (
        <div className="fixed bottom-24 right-6 z-[60] w-72 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#0A1628]/95 backdrop-blur-xl border border-[#A8E63D]/30 p-5 rounded-2xl shadow-2xl relative">
            {/* Close button */}
            <button 
              onClick={() => setShowIntervention(false)}
              className="absolute top-2 right-2 text-[#506584] hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#A8E63D]/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#A8E63D]">smart_toy</span>
              </div>
              <div>
                <p className="text-[13px] text-[#E8EAF0] leading-relaxed">
                  Llevas un momento en silencio. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  handleAnalyzeContext(text);
                }}
                className="w-full py-2 bg-[#A8E63D]/10 hover:bg-[#A8E63D]/20 text-[#A8E63D] text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">content_paste_search</span>
                Analizar texto de pantalla
              </button>
              <button 
                onClick={() => {
                  setOpen(true);
                  setShowIntervention(false);
                  setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "¡Claro! Aquí tienes algunos tutoriales que pueden ayudarte: \n\n" + 
                             "• [Configuración ML API](https://youtube.com/atollomlabs/tutorial-ml-api)\n" +
                             "• [Gestión de Almacén](https://youtube.com/atollomlabs/tutorial-warehouse)\n" +
                             "• [Facturación CFDI](https://youtube.com/atollomlabs/tutorial-cfdi)",
                    ts: new Date().toISOString()
                  }]);
                }}
                className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">play_circle</span>
                Ver video tutorial
              </button>
            </div>

            {/* Pointer arrow */}
            <div className="absolute -bottom-1 right-6 w-3 h-3 bg-[#0A1628] border-r border-b border-[#A8E63D]/30 rotate-45" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FAB (Floating Action Button)
          ═══════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          fixed bottom-6 right-6 z-[60]
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#A8E63D] to-[#6BBF00]
          flex items-center justify-center
          shadow-lg shadow-[#A8E63D]/20
          hover:shadow-xl hover:shadow-[#A8E63D]/30
          hover:scale-105
          active:scale-95
          transition-all duration-200
          group
          ${open ? "md:bottom-6" : ""}
        `}
        aria-label={open ? "Cerrar chat de Samantha" : "Abrir chat de Samantha"}
        aria-expanded={open}
      >
        {/* Icono: isotipo o close */}
        {open ? (
          <span className="material-symbols-outlined text-[#0D1B3E] text-2xl">
            close
          </span>
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            <Image
              src="/ATOLLOM_AI_ICON.png"
              alt=""
              width={32}
              height={32}
              className="object-contain"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Pulse ring cuando está cerrado */}
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: "#A8E63D" }}
            aria-hidden="true"
          />
        )}
      </button>
    </>
  );
}
