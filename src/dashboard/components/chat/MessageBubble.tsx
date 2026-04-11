import type { ChatMessage } from "@/types";
import { AgentAvatar } from "./AgentAvatar";

interface MessageBubbleProps {
  message: ChatMessage;
  agentName?: string;
  isStreaming?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  agentName = "KINEXIS",
  isStreaming = false,
}: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    return (
      <div className="flex gap-3 items-start max-w-[85%]">
        <AgentAvatar name={agentName} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="label-sm text-primary-container font-bold uppercase tracking-wider">
              {agentName}
            </span>
            <span className="text-[10px] text-on-surface-variant/50 font-mono">
              {formatTime(message.ts)}
            </span>
          </div>

          <div
            className="
              bg-surface-container-high
              border border-outline-variant/20
              rounded-t-none rounded-br-2xl rounded-bl-2xl rounded-tr-2xl
              px-4 py-3
              text-sm text-on-surface leading-relaxed
              whitespace-pre-wrap
            "
          >
            {message.content}
            {isStreaming && (
              <span
                className="inline-block w-2 h-4 ml-0.5 bg-primary-container align-middle animate-pulse rounded-sm"
                aria-label="Escribiendo..."
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── User bubble (right-aligned) ── */
  return (
    <div className="flex gap-3 items-start max-w-[85%] ml-auto flex-row-reverse">
      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <span className="material-symbols-outlined text-sm text-[#3a4a00]">person</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
          <span className="label-sm text-on-surface-variant font-bold uppercase tracking-wider">
            Tú
          </span>
          <span className="text-[10px] text-on-surface-variant/50 font-mono">
            {formatTime(message.ts)}
          </span>
        </div>

        <div
          className="
            bg-surface-container
            border border-outline-variant/10
            rounded-t-none rounded-bl-2xl rounded-br-2xl rounded-tl-2xl
            px-4 py-3
            text-sm text-on-surface leading-relaxed
            whitespace-pre-wrap
          "
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

/* ── Guardian separator ── */
export function GuardianSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-outline-variant/20" />
      <span className="label-sm text-on-surface-variant/40 uppercase tracking-widest text-[9px]">
        {label}
      </span>
      <div className="flex-1 h-px bg-outline-variant/20" />
    </div>
  );
}
