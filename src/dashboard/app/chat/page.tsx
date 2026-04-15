"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { MessageBubble, GuardianSeparator } from "@/components/chat/MessageBubble";
import { CommandInput } from "@/components/chat/CommandInput";
import { ContextSelector, type ChatContext } from "@/components/chat/ContextSelector";
import { AgentAvatar } from "@/components/chat/AgentAvatar";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Neural core activo. Soy KINEXIS — tu sistema de inteligencia operacional.\n\n" +
    "Puedo ayudarte con ventas, inventario, CFDI, campañas de ads, y el estado de todos los 43 agentes. ¿Cuál es tu misión?",
  ts: new Date().toISOString(),
};

export default function ChatPage() {
  const [messages, setMessages]       = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [context, setContext]         = useState<ChatContext>("full");
  const [streaming, setStreaming]     = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function handleSend(text: string, files?: File[]) {
    const userMsg: ChatMessage = {
      role: "user",
      content: text + (files && files.length > 0 ? `\n\n📎 Archivos adjuntos: ${files.map(f => f.name).join(', ')}` : ''),
      ts: new Date().toISOString(),
      attachments: files?.map(f => f.name)
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });

      if (!res.ok || !res.body) throw new Error("Error del servidor");

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
            // skip malformed chunk
          }
        }
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: accumulated || "Sin respuesta del servidor.",
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Error de conexión: ${err instanceof Error ? err.message : "desconocido"}. Por favor intenta de nuevo.`,
        ts: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="px-4 md:px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <AgentAvatar name="guardian" size="md" />
          <div>
            <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface uppercase leading-none">
              KINEXIS
              <span className="ml-2 font-headline text-sm font-medium italic text-primary-container align-middle">
                Neural Core
              </span>
            </h1>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5 uppercase tracking-widest">
              43 agentes · Contexto:{" "}
              <span className="text-primary-container">
                {context === "full" ? "Completo" : context.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        <ContextSelector value={context} onChange={setContext} />
      </header>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 md:px-6 space-y-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Conversación con KINEXIS"
      >
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showSeparator =
            i > 0 &&
            prevMsg.role === "user" &&
            msg.role === "assistant";

          return (
            <div key={i}>
              {showSeparator && <GuardianSeparator label="KINEXIS responde" />}
              <MessageBubble message={msg} agentName="KINEXIS" />
            </div>
          );
        })}

        {/* Live streaming bubble */}
        {streaming && streamingText && (
          <div>
            <GuardianSeparator label="KINEXIS responde" />
            <MessageBubble
              message={{
                role: "assistant",
                content: streamingText,
                ts: new Date().toISOString(),
              }}
              agentName="KINEXIS"
              isStreaming
            />
          </div>
        )}

        {/* Loading dots if no text yet */}
        {streaming && !streamingText && (
          <div>
            <GuardianSeparator label="KINEXIS responde" />
            <div className="flex gap-3 items-center">
              <AgentAvatar name="guardian" size="sm" />
              <div className="flex gap-1.5 py-3 px-4 bg-surface-container-high rounded-2xl">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary-container/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-6 pb-6 pt-2 border-t border-outline-variant/10">
        <CommandInput onSend={handleSend} disabled={streaming} />
      </div>
    </div>
  );
}
