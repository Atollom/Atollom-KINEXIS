"use client";

import { useRef, useState } from "react";

interface CommandInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  "¿Cuál es el status de órdenes hoy?",
  "Muéstrame alertas de stock crítico",
  "Resumen de CFDIs pendientes",
  "¿Qué agentes están activos?",
];

export function CommandInput({ onSend, disabled = false }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  function handleQuickCommand(cmd: string) {
    setValue(cmd);
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      {/* Quick commands */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickCommand(cmd)}
            className="
              flex-shrink-0
              px-3 py-1
              rounded-full
              border border-outline-variant/30
              text-[10px] text-on-surface-variant
              hover:border-primary-container/50 hover:text-primary-container
              transition-colors
              whitespace-nowrap
            "
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div
        className={`
          relative flex items-end gap-3
          bg-surface-container-lowest
          border-b-2 transition-all duration-200
          rounded-t-sm px-4 py-3
          ${focused
            ? "border-primary-container shadow-[0_4px_20px_rgba(202,253,0,0.12)]"
            : "border-outline-variant/40"
          }
        `}
      >
        {/* Kinexis icon */}
        <span
          className="material-symbols-outlined text-on-surface-variant/60 mb-0.5 flex-shrink-0"
          aria-hidden="true"
        >
          smart_toy
        </span>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={1}
          placeholder="Envía una misión al neural core…"
          className="
            flex-1
            bg-transparent
            text-sm text-on-surface
            placeholder:text-on-surface-variant/40
            placeholder:uppercase placeholder:tracking-widest placeholder:text-xs
            outline-none resize-none
            leading-relaxed
          "
          aria-label="Mensaje para KINEXIS"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={`
            flex-shrink-0 mb-0.5
            w-9 h-9 rounded-full
            flex items-center justify-center
            transition-all duration-200
            ${value.trim() && !disabled
              ? "bg-primary-container text-[#3a4a00] shadow-volt hover:scale-105 active:scale-95"
              : "bg-surface-container text-on-surface-variant/40 cursor-not-allowed"
            }
          `}
          aria-label="Enviar mensaje"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            {disabled ? "sync" : "arrow_upward"}
          </span>
        </button>
      </div>

      <p className="text-[9px] text-on-surface-variant/30 text-center uppercase tracking-widest">
        Enter para enviar · Shift+Enter nueva línea
      </p>
    </div>
  );
}
