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
}

export function SamanthaFAB({ tenantId = "default" }: SamanthaFABProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [initialized, setInitialized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
    setStreaming(true);
    setStreamingText("");

    // Crear AbortController para poder cancelar la petición
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: "full" }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Error del servidor (${res.status})`);
      }

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
          } catch {
            // Chunk malformado — ignorar
          }
        }
      }

      // Agregar respuesta completa al historial
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: accumulated || "Sin respuesta del servidor.",
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      // No reportar errores de abort (usuario cerró el chat)
      if (err instanceof DOMException && err.name === "AbortError") return;

      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Lo siento, hubo un problema de conexión: ${
          err instanceof Error ? err.message : "desconocido"
        }. Intenta de nuevo en unos segundos.`,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }, [inputValue, streaming]);

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

            bg-[#0D1B3E]/98 md:bg-[#0A1628]/97
            backdrop-blur-2xl
            md:border md:border-white/[0.08]
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
